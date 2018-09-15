# CraftingDatabase
[![Build Status](https://travis-ci.org/johvik/CraftingDatabase.svg?branch=master)](https://travis-ci.org/johvik/CraftingDatabase)

## Installation
```sh
<Create a customized .env>

openssl req -newkey rsa:4096 -nodes -keyout key.pem -x509 -days 365 -out certificate.pem

docker-compose up -d

# Add a realm
docker-compose exec db mysql --user=cdb --password=<password> cdb
# e.g: INSERT INTO realm (region, name) VALUES ("eu", "draenor");
```
