const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  lintOnSave: false,
  devServer: {
    port: 8080,
    open: true,
    proxy: {
      '/s3proxy': {
        target: 'https://s3.ap-northeast-2.amazonaws.com',
        changeOrigin: true,
        pathRewrite: {
          '^/s3proxy': ''
        }
      }
    }
  },
  configureWebpack: {
    devtool: 'source-map',
    resolve: {
      alias: {
        vue$: 'vue/dist/vue.esm-bundler.js'
      }
    }
  }
}) 