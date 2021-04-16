const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
    res.json({ data: orders });
}
function isValidOrderId(req, res, next){
    const { data: { status, id} = {} } = req.body
    if (id) {
      if (req.params.orderId !== id) {
          return next({
              status: 400,
              message: `Your order id ${id} does not match`
          })
      }
  } 
  if (!status || status.length === 0 || status === "invalid"){
      return next({
          status: 400,
          message: "Order must have a status of pending, prepairing, out-for-delivery, delivered"
      })
  }
  next()
}

function isValidOrder(req, res, next){
    const { data: {id, deliverTo, mobileNumber, status, dishes} = {}} = req.body

    if (!deliverTo || deliverTo === "") {
        return next({
            status: 400,
            message: `Order must include deliverTo.`
        })
    }
    if (!mobileNumber || mobileNumber === ""){
        return next({
            status: 400,
            message: `Order must include mobileNumber.`
        })
    }
    if (!dishes){
        return next({
            status: 400,
            message: `Order must include a dish.`
        })
    }
    if (dishes.length < 1 || Array.isArray(dishes) === false){
        return next({
            status: 400,
            message: `Order must include at least one dish.`
        })
    }
    for (let i = 0; i < dishes.length; i++){
        const quantity = dishes[i].quantity
        if (!quantity || quantity <= 0 || typeof(quantity) !== "number"){
            return next({
              status: 400,
              message: `Dish ${i} must have a quantity greater than or equal to 1.`
            })
        }
    } 
    next()
}

function create(req, res, next){
    const { data: {id, deliverTo, mobileNumber, status, dishes} = {}} = req.body
    const newOrder = { id: nextId(), deliverTo, mobileNumber, status: "pending", dishes}
    orders.push(newOrder)
    return res.status(201).json({data: newOrder})
}

function checkStatus(req, res, next){
    const { data = { }} = req.body
    console.log("data", data)
    const status = data.status
    const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"]
    if (validStatuses.includes(status)){
        return next()
    } 
    next({
        status:400,
        message:`Order must have a status of pending, prepairing, out-for-delivery or delivered`
    })

}

function orderExists(req, res, next){
    const foundOrder = orders.find((order) => order.id === req.params.orderId)
    res.locals.foundOrder = foundOrder
    if (res.locals.foundOrder){
       return next()
    } else {
        return next({
            status: 404,
            message: `Order not found: ${ req.params.orderId}`
        })
    }
}

function read(req, res, next){
    res.json({data: res.locals.foundOrder})
}

function update(req, res, next){
    res.locals.foundOrder = orders.find((order) => order.id === req.params.orderId) 
    const { data: {id, deliverTo, mobileNumber, status, dishes} = {}} = req.body
    res.locals.foundOrder.id = req.params.orderId
    res.locals.foundOrder.deliverTo = deliverTo
    res.locals.foundOrder.mobileNumber = mobileNumber
    res.locals.foundOrder.status = status
    res.locals.foundOrder.dishes= dishes
    res.json({ data: res.locals.foundOrder})
}

function destroy(req, res, next) {
    // const index = orders.findIndex((order) => order.id === res.locals.foundOrder);
    const foundOrder = orders.find((order) => order.id === req.params.orderId) 
    if (!foundOrder){
        return next({
            status: 404,
            message: `Order ${req.params.orderId} does not exist.`
        })
    } else if (foundOrder.status !== "pending") {
        return next({
            status: 400,
            message: "pending"
        })
    } else {
        return next({ status: 204})
    }
    // orders.splice(index, 1);
    // res.sendStatus(204);
  }



module.exports = {
    list,
    create: [ isValidOrder, create],
    read: [ orderExists, read],
    update: [ orderExists, isValidOrderId, isValidOrder, checkStatus, update],
    delete :[ destroy]
}

