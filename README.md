# CraftingDatabase
[![Build Status](https://www.travis-ci.com/johvik/CraftingDatabase.svg?branch=master)](https://www.travis-ci.com/johvik/CraftingDatabase)

## Installation
```sh
<Create a customized .env>

openssl req -newkey rsa:4096 -nodes -keyout key.pem -x509 -days 365 -out certificate.pem

docker-compose up -d

# Add a realm
Add it to .env before starting or run:
docker-compose exec db mysql --user=cdb --database=cdb --password
# e.g: INSERT INTO connected_realm (connectedRealmId, region) VALUES (1096, "eu");
```
