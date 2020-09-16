# Use a lighter version of Node as a parent image
FROM node:12
# Set the working directory to /client
WORKDIR /zilch/client
# copy package.json into the container at /client
COPY package*.json ./
COPY tsconfig.json ./

# install dependencies
RUN npm install
# Copy the current directory contents into the container at /client
COPY src ./src
COPY public ./public

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run the app when the container launches
CMD gunicorn --bind 0.0.0.0:$PORT wsgi

CMD ["npm", "start"]