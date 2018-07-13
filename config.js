const path = require('path')

module.exports = {
  debug: process.env.NODE_ENV !== 'production',
  host: process.env.HOST || '0.0.0.0',
  port: process.env.PORT || 8080,
  publicURL: process.env.PUBLIC_URL,
  uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, 'upload'),
  useHTTPS: process.env.USE_HTTPS || false,
  certLocation: process.env.CERT_LOCATION || null,
}
