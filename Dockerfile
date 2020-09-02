FROM node:12

WORKDIR /usr/src/app/

COPY package*.json ./

RUN npm install



COPY dist /usr/src/app/dist

COPY src/client /usr/src/app/src/client

EXPOSE 3000
CMD gunicorn --bind 0.0.0.0:$PORT wsgi
CMD ["node", "dist/app.js"]