# Nexus Registration

Domain-agnostic data edition and registration web application for the [Blue Brain Nexus platform](https://github.com/BlueBrain/nexus).

## Prerequisites for development
Node.js 8 or later
npm 5 or later
(Optional) Docker if you want to generate Docker images

## How to use

### Install
Inside the root folder of the application, type:

```shell
npm install
```

### Configure (will not run properly otherwise)
Copy the file `env_default` to `.env`

```shell
cp env_default .env
```

Edit the file `.env` and put the values matching your Nexus instance endpoints and default domain, as well as the base path you want the application to be available under. Example:

```shell
BASE_PATH=/registration  # You want it under yourdomain.tld/registration
BASE_URI=https://bbp-nexus.epfl.ch/v0  # Nexus API endpoint to talk to
DOMAIN=bbp  # Default domain to open
```

### Run tests
```shell
npm test
```

### Build
```shell
npm run build
```

The compiled version of the application will be put into the `dist/` folder.

### Run locally
```shell
npm start
```

The application will be listening to http://127.0.0.1:3000

Do not forget to append the base path you configured in your .env file. Below is an example of full URL to access the application:

```
http://127.0.0.1:3000/registration
```

Use `Ctrl+C` to stop.

### Build Docker image
Will build a Docker image ready to run the application off the nginx mainline Docker image.

```shell
npm run build-docker
```

The resulting image will be named `nexus-registration-webapp:{current_version_number}`

### Run Docker image locally

After building the Docker image, you can run it locally with:

```shell
npm run start-docker
```

The application will be listening to http://127.0.0.1:8000

Do not forget to append the base path you configured in your .env file. Below is an example of full URL to access the application:

```
http://127.0.0.1:8000/registration
```

Use `Ctrl+C` to stop.

## Funding & Acknowledgment

The development of this software was supported by funding to the Blue Brain Project, a research center of the École polytechnique fédérale de
Lausanne (EPFL), from the Swiss government's ETH Board of the Swiss Federal Institutes of Technology.

Copyright © 2015-2021 Blue Brain Project/EPFL

