const path = require("path");

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

function bodyContainsData(propertyName) {
    return (req, _, next) => {
      const { data = {} } = req.body;
      const value = data[propertyName];
      if (value) return next();
      
      next({ status: 400, message: `Dish must include a ${propertyName}` });
    };
  }
  const containsName = bodyContainsData("name");
  const containsDescription = bodyContainsData("description");
  const containsImageUrl = bodyContainsData("image_url");
  function containsPriceGreaterThanZero(req, _, next) {
    const { data: { price } = {} } = req.body;
    if (Number.isInteger(price) && price > 0) return next();
    
    next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }
  function routeIdMatchesBodyId(req, _, next) {
    const dishId = req.params.dishId;
    const { id } = req.body.data;
    if (!id || id === dishId) return next();
    
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  function dishIdExists(req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
      res.locals.dish = foundDish;
      return next();
    }
    next({
      status: 404,
      message: `Dish does not exist: ${req.params.dishId}`,
    });
  }
  function create(req, res) {
    const dish = req.body.data;
    dish.id = nextId();
    dishes.push(dish);
    res.status(201).json({ data: dish });
  }
  function list(_, res) {
    res.json({ data: dishes });
  } 
  function read(_, res) {
    res.json({ data: res.locals.dish });
  }
  function update(req, res) {
    const { id } = res.locals.dish;
    Object.assign(res.locals.dish, req.body.data, { id });
    res.json({ data: res.locals.dish });
  }
  function destroy(_, res) {
    const index = dishes.findIndex((dish) => dish.id === res.locals.dish);
    dishes.splice(index, 1);
    res.sendStatus(204);
  }
  module.exports = {
    create: [
      containsName,
      containsDescription,
      containsPriceGreaterThanZero,
      containsImageUrl,
      create,
    ],
    delete: [dishIdExists, destroy],
    list,
    read: [dishIdExists, read],
    update: [
      dishIdExists,
      routeIdMatchesBodyId,
      containsName,
      containsDescription,
      containsPriceGreaterThanZero,
      containsImageUrl,
      update,
    ],
  };
  