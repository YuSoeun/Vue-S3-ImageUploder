<template>
  <div id="app">
    <header>
      <h1>S3 이미지 업로더</h1>
      <p>AWS S3와 Lambda를 사용한 이미지 업로드 및 썸네일 생성 서비스</p>
    </header>
    
    <main>
      <ImageUploader />
    </main>
    
    <footer>
      <p>&copy; 2023 S3 이미지 업로더</p>
    </footer>
  </div>
</template>

<script>
import ImageUploader from './ImageUploader.vue';

export default {
  name: 'App',
  components: {
    ImageUploader
  }
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background-color: #f9f9f9;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
}

header {
  text-align: center;
  padding: 30px 0;
  background-color: #f3f3f3;
  margin-bottom: 20px;
  border-radius: 0 0 8px 8px;
}

h1 {
  margin: 0;
  color: #333;
}

header p {
  color: #666;
  margin-top: 10px;
}

main {
  padding: 0 20px;
}

footer {
  text-align: center;
  padding: 20px 0;
  margin-top: 50px;
  color: #666;
  border-top: 1px solid #eee;
}
</style> 