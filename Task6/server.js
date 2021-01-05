const http = require('http');
const express = require('express');
const path = require('path');
const app = express();
const stripe = require('stripe')('sk_test_51I691rAolLg5hvOohzqUhTWOqXrXdNQZTvGBLPzMKNBvX5OA76LgtySfP8FKQbQHTWMoZBRfzTa6idf151fn1iBu00MhwEPQvu');
app.use(express.json());
app.use(express.static("express"));


// default URL for website
app.get('/', function(req,res){
    res.send('Hello World!')
  });

app.post('/customer-portal', async (req, res) => {
    // Authenticate your user.

    const session = await stripe.billingPortal.sessions.create({
        customer: 'cus_Ihc0JZ8uLAnsBk',
        return_url: 'https://example.com/account',
    });
    
    res.send(session.url);
});

const server = http.createServer(app);
const port = 3000;
server.listen(port);
console.debug('Server listening on port ' + port);