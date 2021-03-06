import { FabrixController as Controller } from '@fabrix/fabrix/dist/common'
import * as Validator from '../../validator'
// import { ModelError } from '@fabrix/spool-sequelize/dist/errors'

/**
 * @module ShopController
 * @description Shop Controller.
 */
export class ShopController extends Controller {
  generalStats(req, res) {
    res.json({})
  }
  /**
   * count the amount of shops
   * @param req
   * @param res
   */
  count(req, res) {
    const EventsService = this.app.services.EventsService
    EventsService.count('Shop')
      .then(count => {
        const counts = {
          shops: count
        }
        return res.json(counts)
      })
      .catch(err => {
        return res.serverError(err)
      })
  }

  /**
   *
   * @param req
   * @param res
   */
  findAll(req, res) {
    const orm = this.app.models
    const Shop = orm['Shop']
    const limit = Math.max(0, req.query.limit || 10)
    const offset = Math.max(0, req.query.offset || 0)
    const sort = req.query.sort || [['created_at', 'DESC']]
    const where = req.jsonCriteria(req.query.where)

    Shop.findAndCountAll({
      where: where,
      order: sort,
      offset: offset,
      limit: limit,
      req: req
    })
      .then(shops => {
        // Paginate
        res.paginate(shops.count, limit, offset, sort)
        return this.app.services.PermissionsService.sanitizeResult(req, shops.rows)
      })
      .then(result => {
        return res.json(result)
      })
      .catch(err => {
        return res.serverError(err)
      })
  }

  /**
   *
   * @param req
   * @param res
   */
  create(req, res) {
    const ShopService = this.app.services.ShopService
    Validator.validateShop.create(req.body)
      .then(values => {
        return ShopService.create(req.body)
      })
      .then(shop => {
        return this.app.services.PermissionsService.sanitizeResult(req, shop)
      })
      .then(result => {
        return res.json(result)
      })
      .catch(err => {
        return res.serverError(err)
      })
  }

  /**
   *
   * @param req
   * @param res
   */
  update(req, res) {
    const ShopService = this.app.services.ShopService
    const id = req.params.id

    Validator.validateShop.update(req.body)
      .then(values => {
        return ShopService.update(id, req.body)
      })
      .then(shop => {
        return this.app.services.PermissionsService.sanitizeResult(req, shop)
      })
      .then(result => {
        return res.json(result)
      })
      .catch(err => {
        return res.serverError(err)
      })
  }


  addCustomer(req, res) {

  }
  removeCustomer(req, res) {

  }
  customers(req, res) {

  }

  addOrder(req, res) {

  }
  removeOrder(req, res) {

  }
  orders(req, res) {

  }

  addProduct(req, res) {

  }
  removeProduct(req, res) {

  }
  products(req, res) {

  }

  addUser(req, res) {

  }
  removeUser(req, res) {

  }
  users(req, res) {

  }
}

