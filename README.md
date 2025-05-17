# Vue S3 이미지 업로더

AWS S3, Lambda, CloudFront를 사용하여 이미지를 업로드하고 썸네일을 자동으로 생성하는 Vue 애플리케이션입니다.

## 동작 화면

![애플리케이션 동작 화면](images/screenshot.png)
![애플리케이션 동작 화면2](images/screenshot2.png)

*이미지 업로드 및 썸네일 자동 생성 기능을 보여주는 화면*

## 기능

- 이미지 파일 선택 및 AWS S3 업로드
- 업로드 진행 상태 표시 
- 업로드 후 Lambda 함수에 의한 썸네일 자동 생성
- CloudFront를 통한 원본 이미지 및 썸네일 제공
- 이미지 URL 클립보드 복사

## 설치 및 설정

1. 저장소 클론 및 의존성 설치
   ```bash
   git clone https://github.com/your-username/vue-s3-uploader.git
   cd vue-s3-uploader
   npm install
   ```

2. 환경 설정
   - `env.example` 파일을 `.env.local`로 복사
   - AWS 설정 정보 입력
   ```bash
   cp env.example .env.local
   # .env.local 파일을 편집하여 AWS 설정 입력
   ```

3. 개발 서버 실행
   ```bash
   npm run serve
   ```

## 환경 변수 설정

프론트엔드(Vue) 환경 변수:
```
VUE_APP_AWS_REGION=ap-northeast-2       # AWS 리전
VUE_APP_S3_BUCKET_NAME=your-bucket-name # S3 버킷 이름
VUE_APP_AWS_ACCESS_KEY=YOUR_ACCESS_KEY  # AWS 액세스 키
VUE_APP_AWS_SECRET_KEY=YOUR_SECRET_KEY  # AWS 시크릿 키
```

## AWS 리소스 설정

### 1. S3 버킷 설정
   - 버킷 생성 및 퍼블릭 액세스 설정 구성
   - CORS 설정 (웹 브라우저에서 직접 업로드 허용):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
       "AllowedOrigins": ["http://localhost:8080", "http://localhost:8081"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
   - 버킷 정책 설정 (필요한 경우)

### 2. Lambda 함수 설정
   - S3 버킷에 이미지가 업로드될 때 트리거되는 Lambda 함수 생성
   - Sharp 라이브러리를 사용한 썸네일 생성 함수 구현
   - 썸네일 이미지는 images/thumb/ 경로에 저장되도록 설정

### 3. CloudFront 설정
   - S3 버킷을 오리진으로 하는 CloudFront 배포 생성
   - CORS 헤더 전달 설정
   - 캐시 설정 및 TTL 구성
   - 필요한 경우 OAI(Origin Access Identity) 설정하여 S3에 직접 접근 제한

## 사용 방법

1. 이미지 파일 선택 (지원 형식: JPEG, PNG, GIF, WebP 등)
2. "업로드" 버튼 클릭
3. 업로드 진행 상태 확인
4. 업로드 완료 후 CloudFront를 통한 원본 이미지 확인
5. 잠시 후 썸네일 이미지 생성 확인
6. 필요한 URL 복사하여 사용

## 프로젝트 구조

```
vue-s3-uploader/
├── src/
│   ├── App.vue            # 메인 애플리케이션 컴포넌트
│   ├── ImageUploader.vue  # 이미지 업로드 컴포넌트
│   └── main.js            # Vue 애플리케이션 진입점
├── .env.local             # 프론트엔드 환경 변수 (git에 포함되지 않음)
├── env.example            # 프론트엔드 환경 변수 예시
└── vue.config.js          # Vue CLI 설정
```

## 보안 고려사항

- 프로덕션 환경에서는 프론트엔드에 직접 AWS 키를 노출하지 않도록 주의하세요
- AWS IAM 역할과 정책을 최소 권한 원칙에 따라 설정하세요
- CloudFront + OAI를 사용하여 S3에 직접 접근을 제한하세요

## 트러블슈팅

- **CORS 오류**: S3 버킷의 CORS 설정을 확인하고 CloudFront에서 오리진 헤더를 전달하는지 확인하세요
- **403 오류**: IAM 권한과 버킷 정책을 확인하세요
- **썸네일 생성 실패**: Lambda 함수 로그를 확인하고 권한 설정을 점검하세요 