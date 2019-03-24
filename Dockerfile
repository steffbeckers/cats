# build stage
FROM node:alpine as build-stage

# ARG vue_build_mode

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# RUN npm run build.${vue_build_mode}
RUN npm run build

# production stage
FROM nginx as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

COPY --from=build-stage /app/nginx.conf /etc/nginx/nginx.conf
