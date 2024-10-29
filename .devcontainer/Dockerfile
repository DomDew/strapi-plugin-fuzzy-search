FROM mcr.microsoft.com/devcontainers/typescript-node:20

RUN apt-get update

# Install dependencies
RUN apt-get --no-install-recommends install -y \ 
  # clean up
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*
