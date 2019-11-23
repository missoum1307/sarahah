const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser')
const sgMail = require('@sendgrid/mail')
const mongoose = require('mongoose')
const requestIp = require('request-ip')
const geoip = require('geoip-lite')

const url = process.env.urldbprod
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
const db = mongoose.connection;
db.on('error', (err)=> {
   console.log(err);
})
db.once('open', () => {
   console.log('Connection opened on:', url);
})

sgMail.setApiKey(process.env.sendGrid_api_key)

const port = process.env.PORT || 3000 

app.set('trust proxy', true)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname,'../public')))

const ipMiddleware = (req, res, next) => {
    const clientIp = requestIp.getClientIp(req)
    req.userip = clientIp
    next()
}

const Schema = mongoose.Schema
const messageSchema = new Schema({ Message: String, ip: String, range: Array, country: String, city: String, ll: Array, region: String, city: String, userAgent: String})

app.post('/message', ipMiddleware, async (req, res) => {
    const geo = geoip.lookup(req.userip)
    const userAgent = req.header('User-Agent')
    sgMail.send({
        to: 'missoumozil@gmail.com',
        from: 'missoumxss@gmail.com',
        subject: 'Saraha Message',
        text: req.body.message
      })

      const Message = mongoose.model('Message', messageSchema)
      const msg = new Message({ Message: req.body.message, ip: req.userip, range: geo.range, country: geo.country, ll: geo.ll, region: geo.region, city: geo.city, userAgent })
      try {
        await msg.save().then(() => console.log('message has been saved!')).catch((e) => {
            if (e) {
                console.log(e)
                return res.redirect('/saraha/index.html')
            }
          })
      } catch (e) {
        console.log(e)
        return res.redirect('/saraha/index.html')
      }

      setTimeout(() => { res.redirect('/saraha/index.html') }, 2000);

    })




app.listen(port, () => {
    console.log('app running on ', port)
})