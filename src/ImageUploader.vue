<template>
  <div class="uploader-container">
    <h2>이미지 업로더</h2>
    
    <div class="upload-form">
      <input type="file" @change="handleFileChange" accept="image/*" :disabled="isUploading" />
      <button @click="uploadImage" :disabled="!selectedFile || isUploading">
        {{ isUploading ? '업로드 중...' : '업로드' }}
      </button>
    </div>
    
    <div v-if="isUploading" class="loading">
      <p>이미지 업로드 및 썸네일 생성 중...</p>
      <div class="progress-bar">
        <div class="progress" :style="{ width: uploadProgress + '%' }"></div>
      </div>
    </div>
    
    <div v-if="uploadedUrls.original" class="result">
      <h3>업로드 결과</h3>
      <div class="image-previews">
        <div class="preview-container">
          <h4>원본 이미지</h4>
          <img :src="uploadedUrls.original" alt="Original Image" />
          <p class="url">{{ uploadedUrls.original }}</p>
          <button @click="copyToClipboard(uploadedUrls.original)">URL 복사</button>
        </div>
        
        <div v-if="uploadedUrls.thumbnail" class="preview-container">
          <h4>썸네일 이미지</h4>
          <img :src="uploadedUrls.thumbnail" alt="Thumbnail Image" />
          <p class="url">{{ uploadedUrls.thumbnail }}</p>
          <button @click="copyToClipboard(uploadedUrls.thumbnail)">URL 복사</button>
        </div>
      </div>
    </div>
    
    <div v-if="error" class="error">
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script>
import AWS from 'aws-sdk';
import axios from 'axios';

export default {
  name: 'ImageUploader',
  data() {
    return {
      selectedFile: null,
      isUploading: false,
      uploadProgress: 0,
      uploadedUrls: {
        original: '',
        thumbnail: ''
      },
      error: '',
      // AWS 설정 (직접 입력)
      s3Config: {
        region: process.env.VUE_APP_AWS_REGION || 'ap-northeast-2',
        bucketName: process.env.VUE_APP_S3_BUCKET_NAME || '', 
        accessKeyId: process.env.VUE_APP_AWS_ACCESS_KEY || '',
        secretAccessKey: process.env.VUE_APP_AWS_SECRET_KEY || ''
      },
      // 사용자 닉네임 설정
      userNickname: 'soso',
      // 썸네일 경로 설정
      thumbPrefix: 'thumb/',
      // 폴링 관련 설정
      pollingInterval: null,
      maxPollingAttempts: 10,
      pollingCount: 0
    };
  },
  methods: {
    // 파일 선택 핸들러
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file && file.type.match('image.*')) {
        this.selectedFile = file;
        this.error = '';
      } else {
        this.error = '이미지 파일만 업로드할 수 있습니다.';
        this.selectedFile = null;
      }
    },
    
    // S3 업로드 함수
    async uploadImage() {
      if (!this.selectedFile) {
        this.error = '업로드할 파일을 선택해주세요.';
        return;
      }
      
      this.isUploading = true;
      this.uploadProgress = 0;
      this.error = '';
      
      try {
        // AWS 설정
        AWS.config.region = this.s3Config.region;
        
        // 직접 자격 증명 설정 (테스트용, 실제 서비스에서는 권장하지 않음)
        AWS.config.credentials = new AWS.Credentials({
          accessKeyId: this.s3Config.accessKeyId,
          secretAccessKey: this.s3Config.secretAccessKey
        });
        
        // S3 서비스 객체 생성
        const s3 = new AWS.S3({
          apiVersion: '2006-03-01',
          params: { Bucket: this.s3Config.bucketName }
        });
        
        // 파일명 및 경로 생성 (사용자 닉네임 폴더 포함)
        const timestamp = new Date().getTime();
        console.log('time: ', Date.prototype.getTime);
        const fileExtension = this.selectedFile.name.split('.').pop();
        const fileName = `images/${this.userNickname}/${timestamp}-${this.selectedFile.name}`;
        
        // S3에 업로드
        const params = {
          Bucket: this.s3Config.bucketName,
          Key: fileName,
          Body: this.selectedFile,
          ContentType: this.selectedFile.type
        };
        
        // 업로드 진행 및 결과 처리
        s3.upload(params, (err, data) => {
          if (err) {
            this.error = `업로드 중 오류가 발생했습니다: ${err.message}`;
            this.isUploading = false;
            return;
          }
          
          // 원본 이미지 URL 저장 (CloudFront 사용)
          const cloudFrontDomain = 'https://d8h3hut1jkl2n.cloudfront.net';
          this.uploadedUrls.original = `${cloudFrontDomain}/${fileName}`;
          
          // 예상 썸네일 URL 생성 (CloudFront 사용)
          const expectedThumbnailPath = fileName.replace(/^images\/(.+?)\//, `images/thumb/$1/`);
          const thumbnailUrl = `${cloudFrontDomain}/${expectedThumbnailPath}`;
          
          // Lambda 함수가 썸네일을 생성할 시간을 주기 위해 폴링 시작
          this.startPollingForThumbnail(thumbnailUrl);
        }).on('httpUploadProgress', (progress) => {
          // 업로드 진행률 업데이트
          this.uploadProgress = Math.round((progress.loaded / progress.total) * 100);
        });
        
      } catch (error) {
        this.error = `업로드 준비 중 오류가 발생했습니다: ${error.message}`;
        this.isUploading = false;
      }
    },
    
    // 썸네일 생성 완료 확인을 위한 폴링 함수
    startPollingForThumbnail(thumbnailUrl) {
      this.pollingCount = 0;
      
      // 이전 폴링 인터벌이 있다면 정리
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
      
      // 정기적으로 썸네일 존재 여부 확인
      this.pollingInterval = setInterval(async () => {
        this.pollingCount++;
        
        try {
          // HEAD 요청으로 썸네일 존재 여부 확인
          const response = await axios.head(thumbnailUrl);
          
          if (response.status === 200) {
            // 썸네일이 생성됨
            this.uploadedUrls.thumbnail = thumbnailUrl;
            clearInterval(this.pollingInterval);
            this.isUploading = false;
          }
        } catch (error) {
          // 아직 썸네일이 생성되지 않음
          if (this.pollingCount >= this.maxPollingAttempts) {
            // 최대 시도 횟수 초과
            clearInterval(this.pollingInterval);
            this.error = '썸네일 생성 확인 제한 시간이 초과되었습니다.';
            this.isUploading = false;
          }
        }
      }, 1000); // 1초마다 확인
    },
    
    // URL을 클립보드에 복사
    copyToClipboard(text) {
      navigator.clipboard.writeText(text)
        .then(() => {
          alert('URL이 클립보드에 복사되었습니다.');
        })
        .catch((err) => {
          console.error('URL 복사 실패:', err);
          this.error = 'URL 복사에 실패했습니다.';
        });
    }
  }
};
</script>

<style scoped>
.uploader-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.upload-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.loading {
  margin: 20px 0;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
}

.image-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.preview-container {
  flex: 1;
  min-width: 300px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.preview-container img {
  max-width: 100%;
  height: auto;
  margin-bottom: 10px;
}

.url {
  word-break: break-all;
  font-size: 12px;
  background-color: #f5f5f5;
  padding: 5px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.error {
  color: #d32f2f;
  margin-top: 20px;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
}
</style> 