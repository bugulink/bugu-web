BuguLink
========

[BuguLink](https://bugu.link) is a secure file-sharing website. It is an MIT-licensed open source project. The project contains two parts: [backend](https://github.com/bugulink/bugu-web) (Node.js + Koa2 + MySQL + Redis) and [frontend](https://github.com/bugulink/bugu-static) (React + [Yax](https://github.com/d-band/yax) + ReactRouter). It use [Qiniu](https://www.qiniu.com) CDN to storage files.

## Features

- **Fast:** Upload in chunks, Resume breakpoint, Support large file upload, Upload 1GB file only in 4 minutes
- **Simple:** Minimalist UI, Easy to use, Easy to develop, Easy to deploy
- **Secure:** Login with dynamic token, Share link with random code, Auto delete and stop share anytime
- **Configurable:** Config with environment variables

## Develop

1. Install MySQL and Sign up [Qiniu Account](https://www.qiniu.com).
2. Config environment variables ([More config](https://github.com/bugulink/bugu-web/blob/master/src/config.js)).

   ```
   # Database Config
   export BUGU_DB_NAME="Your database name"
   export BUGU_DB_USER="Your database username"
   export BUGU_DB_PASS="Your database password"
   export BUGU_DB_HOST="127.0.0.1"
   export BUGU_DB_PORT=3306

   # Qiniu CDN Config
   export BUGU_QN_NAME="Your Qiniu bucket name"
   export BUGU_QN_AK="Your Qiniu access key"
   export BUGU_QN_SK="Your Qiniu secret key"
   export BUGU_QN_DOMAIN="Your Qiniu bucket domain"
   ```

3. Clone source from Github.

   ```
   git clone https://github.com/bugulink/bugu-web.git
   git clone https://github.com/bugulink/bugu-static.git
   ```

4. Backend develop.

   ```
   cd bugu-web
   npm install
   npm start
   ```

5. Frontend develop.

   ```
   cd bugu-static
   npm install dool -g
   npm install
   npm start
   ```

6. Open [http://localhost:8080](http://localhost:8080).

## Report a issue

* [All issues](https://github.com/bugulink/bugu-web/issues)
* [New issue](https://github.com/bugulink/bugu-web/issues/new)

## License

BuguLink is available under the terms of the MIT License.
