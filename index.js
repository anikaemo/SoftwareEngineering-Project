const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()

const port = process.env.PORT || 5000
const app = express()

app.use(cors())
app.use(express.json())

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@main.yolij.mongodb.net/?retryWrites=true&w=majority&appName=Main`
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.znakkyg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function run() {
  try {
    const db = client.db('marketDB')
    const jobsCollection = db.collection('jobs')
    const bidsCollection = db.collection('bids')

    // save jobData db
    app.post('/add-job', async (req, res) => {
      const jobData = req.body;
      const result = await jobsCollection.insertOne(jobData)
      res.send(result)
    })

    //get all jobs data form db
    app.get('/jobs', async (req, res) => {
      const result = await jobsCollection.find().toArray()
      res.send(result)
    })

    // get all jobs posted by specific user
    app.get('/jobs/:email', async (req, res) => {
      const email = req.params.email
      const query = { 'buyer.email': email }

      const result = await jobsCollection.find(query).toArray()
      console.log(result)
      res.send(result)
    })

    //delete a job
    app.delete('/job/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobsCollection.deleteOne(query)
      res.send(result)
    })

    //get a single job data from db
    app.get('/job/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await jobsCollection.findOne(query)
      res.send(result)
    })

    app.put('/update-job/:id', async (req, res) => {
      const id = req.params.id
      const jobData = req.body;
      const updated = {
        $set: jobData,
      }
      const query = { _id: new ObjectId(id) }
      const options = {upsert: true}
      const result = await jobsCollection.updateOne(query,updated,options)
      res.send(result)
    })

    // save a bids data in db
    app.post('/add-bid', async (req, res) => {
      const bidData = req.body;
      //0. if a user placed a bid already in this job
      const query ={email: bidData.email, jobId: bidData.jobId}
      const alreadyExist = await bidsCollection.findOne(query)
      console.log('If already Exist--->',alreadyExist)
      if(alreadyExist) return res.status(404).send('You Have already placed a bid on this job')

      //1. Save a bid in bids collection
      
      const result = await bidsCollection.insertOne(bidData)
      //2. Increase bid count in jobs collection
      const filter = {_id : new ObjectId(bidData.jobId)}
      const update ={
        $inc:{bid_count: 1},
      }
      const updateBidCount = await jobsCollection.updateOne(filter,update)
      res.send(result)
    })

    //get all bids for a specific user
    app.get('/bids/:email',async(req,res)=>{
      const email = req.params.email
      const query = {email}
      const result = await bidsCollection.find(query).toArray()
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)
app.get('/', (req, res) => {
  res.send('Hello from SoloSphere Server....')
})

app.listen(port, () => console.log(`Server running on port ${port}`))
