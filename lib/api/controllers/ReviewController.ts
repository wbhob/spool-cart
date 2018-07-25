

import { FabrixController as Controller } from '@fabrix/fabrix/dist/common'
const Errors = require('engine-errors')
const lib = require('../../lib')

/**
 * @module ReviewController
 * @description Generated Fabrix.js Controller.
 */
export class ReviewController extends Controller {
  /**
   *
   * @param req
   * @param res
   */
  generalStats(req, res) {
    return res.json({})
  }

  /**
   *
   * @param req
   * @param res
   */
  count(req, res) {
    const EngineService = this.app.services.EngineService
    EngineService.count('ProductReview')
      .then(count => {
        const counts = {
          reviews: count
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
  findById(req, res) {
    const orm = this.app.models
    const Review = orm['ProductReview']
    const id = req.params.id

    Review.findById(id, {})
      .then(review => {
        if (!review) {
          throw new Errors.FoundError(Error(`Review id ${id} not found`))
        }
        return this.app.services.PermissionsService.sanitizeResult(req, review)
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
  findAll(req, res) {
    const Review = this.app.models['ProductReview']
    const limit = Math.max(0, req.query.limit || 10)
    const offset = Math.max(0, req.query.offset || 0)
    const sort = req.query.sort || [['created_at', 'DESC']]
    const where = res.jsonCriteria(req.query.where)

    Review.findAndCountAll({
      order: sort,
      offset: offset,
      limit: limit,
      where: where
    })
      .then(reviews => {
        // Paginate
        res.paginate(reviews.count, limit, offset, sort)
        return this.app.services.PermissionsService.sanitizeResult(req, reviews.rows)
      })
      .then(result => {
        return res.json(result)
      })
      .catch(err => {
        return res.serverError(err)
      })
  }
  // TODO
  search(req, res) {
    const Review = this.app.models['ProductReview']
    const limit = Math.max(0, req.query.limit || 10)
    const offset = Math.max(0, req.query.offset || 0)
    const sort = req.query.sort || [['created_at', 'DESC']]
    const where = res.jsonCriteria(req.query.where)

    Review.findAndCountAll({
      order: sort,
      offset: offset,
      limit: limit,
      where: where
    })
      .then(reviews => {
        // Paginate
        res.paginate(reviews.count, limit, offset, sort)
        return this.app.services.PermissionsService.sanitizeResult(req, reviews.rows)
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
    const ReviewService = this.app.services.ReviewService
    lib.Validator.validateImage.create(req.body)
      .then(values => {
        return ReviewService.create(req.body)
      })
      .then(review => {
        return this.app.services.PermissionsService.sanitizeResult(req, review)
      })
      .then(result => {
        return res.json(result)
      })
      .catch(err => {
        // console.log('ReviewController.removeVariant', err)
        return res.serverError(err)
      })
  }

  /**
   *
   * @param req
   * @param res
   */
  update(req, res) {
    const ReviewService = this.app.services.ReviewService
    lib.Validator.validateImage.update(req.body)
      .then(values => {
        return ReviewService.update(req.body)
      })
      .then(review => {
        return this.app.services.PermissionsService.sanitizeResult(req, review)
      })
      .then(result => {
        return res.json(result)
      })
      .catch(err => {
        // console.log('ReviewController.removeVariant', err)
        return res.serverError(err)
      })
  }

  /**
   *
   * @param req
   * @param res
   */
  destroy(req, res) {
    const ReviewService = this.app.services.ReviewService
    lib.Validator.validateImage.destroy(req.body)
      .then(values => {
        return ReviewService.destroy(req.body)
      })
      .then(review => {
        return this.app.services.PermissionsService.sanitizeResult(req, review)
      })
      .then(result => {
        return res.json(result)
      })
      .catch(err => {
        // console.log('ReviewController.removeVariant', err)
        return res.serverError(err)
      })
  }
}
