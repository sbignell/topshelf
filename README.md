Sid
=============

Sid is a node.js server.

In conjunction with his mate Sven, the front-end, they provide you with a node.js example framework that utilises MySQL as the data store http://www.sidandsven.com. Sven is built using javascript, grunt, JST templates, and backbone. Based on jedireza's fantastic [Drywall](http://jedireza.github.io/drywall/) project.


Live Demos
------------

| Platform                    | Username | Password |
| --------------------------- | -------- | -------- |
| http://www.sidandsven.com/  | root     | h@rr0    |


Installation
------------

```bash
$ git clone git@github.com:sbignell/sid.git && cd ./sid
$ npm install
$ mv ./config.example.js ./config.js #set vars
$ grunt
```

Setup
------------

- Run the SQL-INIT scripts on your mysql instance.
- cp sven's www folder's contents to sid's client folder (or use another front-end)
- Reset your root password
- Login

(I do a bunch of other things that you may want to know.. I'll put together a better setup process in due time)



Contributing
------------

Contributions at this time are not welcome. Purely because it's so new, but yes, in time I'd love to open it up for contribution. In the meantime feel free to use it, clone it etc.


License
------------

MIT


~SB