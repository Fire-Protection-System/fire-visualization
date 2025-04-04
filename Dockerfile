FROM node:16

RUN apt-get update && apt-get install -y \
    libgtk-3-0 \
    libx11-dev \
    libxss1 \
    libasound2 \
    libxtst6 \
    libnss3 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libgdk-pixbuf2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . /app
RUN npm install
CMD ["npm", "start"]
