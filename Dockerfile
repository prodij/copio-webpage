FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY server.js ./
COPY index.html ./
RUN echo '[]' > waitlist.json
EXPOSE 3001
CMD ["node", "server.js"]
