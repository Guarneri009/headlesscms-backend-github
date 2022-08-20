FROM amazonlinux:2

# yum update & install
RUN yum update -y \
    && yum install \
    systemd \
    tar \
    wget \
    unzip \
    sudo \
    git \
    make \
    -y

# install nodejs 16.x (Amazon linux 2)
RUN curl --silent --location https://rpm.nodesource.com/setup_16.x | sudo bash - \
    && yum -y install nodejs

# install aws cli v2 cdk
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip  -d aws-cli2-installation \
    && ./aws-cli2-installation/install \
    && npm install -g aws-cdk typescript tsc \
    && amazon-linux-extras install docker

# install AWS SAM CLI
RUN wget "https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip" \
    && unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
    && ./sam-installation/install

# /sbin/initから起動する docker デーモンを使うため
CMD ["/usr/sbin/init"]