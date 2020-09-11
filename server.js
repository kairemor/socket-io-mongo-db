const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4100).sockets;
const url = 'mongodb://localhost:27017/';

//mongo connect 
mongo.connect(url, {
    useNewUrlParser: true
}, (err, cli) => {
    if (err) {
        throw err;
    }
    const db = cli.db('mongochat');
    console.log("Mongo connected");

    //connect socket.io
    client.on('connection', (socket) => {
        let chat = db.collection('chats');

        //create function to send status     
        sendStatus = (s) => {
            socket.emit('status', s);
        };

        //Get chats from mongo collection 
        chat.find().limit(100).sort({
            _id: 1
        }).toArray((err, res) => {
            if (err) {
                throw err;
            }
            socket.emit('output', res);
        });

        //handle input event 
        socket.on('input', (data) => {
            let name = data.name;
            let message = data.message;

            //check fr name and message 
            if (name == '' || message == '') {
                //send error status 
                sendStatus('Please enter a name and message ');
            } else {
                //Insert nessage 
                chat.insert({
                    username: name,
                    message: message
                }, () => {
                    client.emit('output', [data]);

                    //send status objects 

                    sendStatus({
                        message: ' Message sent',
                        clear: true
                    });
                });
            }
        });
        //handle clear 

        socket.on('clear', (data) => {
            //remove all chat from the collection 
            chat.remove({}, () => {
                socket.emit('cleared');
            });
            sendStatus({
                message: 'All message are deleted',
                clear: true
            });
        });
    });
});