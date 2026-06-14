# MongoDB Local Server Notes

Last updated: 2026-06-09

Use this as the quick reference for running MongoDB locally on this machine.

## Mental Model

```text
mongod      = MongoDB database server
mongosh     = terminal client used to talk to MongoDB
27017       = default MongoDB server port
mongodb://localhost:27017 = local MongoDB connection URL
```

MongoDB and PostgreSQL are separate database servers:

```text
MongoDB server:     mongod
MongoDB shell:      mongosh
MongoDB port:       27017
MongoDB data path:  /usr/local/var/mongodb
MongoDB URL:        mongodb://localhost:27017/MyApp

PostgreSQL server:  postgres
PostgreSQL shell:   psql
PostgreSQL port:    5432
PostgreSQL URL:     postgresql://localhost:5432/postgres
```

## Installed Versions Checked

On this machine, MongoDB was installed through Homebrew:

```text
mongosh 2.5.0
mongod 7.0.14
mongodb-community@7.0
```

## Start MongoDB

```bash
brew services start mongodb-community@7.0
```

Expected:

```txt
Successfully started `mongodb-community@7.0`
```

## Stop MongoDB

```bash
brew services stop mongodb-community@7.0
```

Expected status after stopping:

```txt
mongodb-community@7.0 none
```

## Restart MongoDB

```bash
brew services restart mongodb-community@7.0
```

## Check Status

```bash
brew services list | grep mongo
```

Expected when running:

```txt
mongodb-community@7.0 started
```

Check whether port `27017` is listening:

```bash
lsof -nP -iTCP:27017 -sTCP:LISTEN
```

Expected:

```txt
mongod ... TCP 127.0.0.1:27017 (LISTEN)
```

## Connect With mongosh

```bash
mongosh
```

If MongoDB is running, expected startup output includes:

```txt
Connecting to: mongodb://127.0.0.1:27017
Using MongoDB: 7.0.14
```

If MongoDB is stopped, expected error:

```txt
MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

## Useful mongosh Commands

```js
show dbs
db
use MyApp
show collections
db.users.find()
db.users.find().pretty()
db.users.insertOne({ name: "Amit", email: "amit@example.com" })
db.users.updateOne({ name: "Amit" }, { $set: { isActive: true } })
db.users.deleteOne({ name: "Amit" })
exit
```

Notes:

```text
test = default database selected by mongosh
MyApp = example app database used in MongoDB practice notes
```

A MongoDB database is only really created after data is inserted into it.

## DataGrip Connection

Use these values in DataGrip:

```text
Data Source: MongoDB
Host: localhost
Port: 27017
Authentication: none
URL: mongodb://localhost:27017
```

The local MongoDB warning:

```txt
Access control is not enabled
```

means username/password authentication is disabled. That is common for local
learning, but not suitable for production.

## MongoDB URL Meaning

```text
mongodb://localhost:27017
```

means:

```text
connect to MongoDB running on my own machine at port 27017
```

With a database name:

```text
mongodb://localhost:27017/MyApp
```

means:

```text
connect to local MongoDB and use the MyApp database
```

The URL does not start MongoDB. It only tells tools or code where to connect.

## Project Folder Vs Database Storage

This MongoDB project folder stores notes and code:

```text
/Users/knight/Desktop/projects/mcp-testing/on/projects/MongoDb
```

The actual MongoDB database files are stored by the MongoDB server, usually:

```text
/usr/local/var/mongodb
```

Programming languages do not store database data by themselves. They connect to
the database server.
