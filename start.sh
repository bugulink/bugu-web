#! /bin/bash

NODE_ENV=production pm2 start app/index.js --watch --name "bugu-web"
