FROM node:12

WORKDIR /zilch/server

COPY package*.json ./

RUN npm install



COPY dist /zilch/server/dist
COPY client/build /zilch/server/client/build

EXPOSE 3001
CMD gunicorn --bind 0.0.0.0:$PORT wsgi
CMD ["node", "dist/app.js"]