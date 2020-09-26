'use strict';


const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
  /**
   * Create a record.
   *
   * @return {Object}
   */

  async create(ctx) {
    let entity;

    const [cart] = await strapi.services.cart.find({
      id: ctx.state.user.id, product: ctx.request.body.product
    }); 
    if (cart){
      return ctx.unauthorized("This item is already in cart");
    }

    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      data.user = ctx.state.user.id;
      entity = await strapi.services.cart.create(data, { files });
    } else {
      ctx.request.body.user = ctx.state.user.id;
      entity = await strapi.services.cart.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.cart });
  },


/**
   * Update a record.
   *
   * @return {Object}
   */

  async update(ctx) {
    const { id } = ctx.params;

    let entity;
    let isAdmin = false;

    if (ctx.state.user.role.type == "Admin") {
        isAdmin = true;
    }

    const [cart] = await strapi.services.cart.find({
      id: ctx.params.id
    });

    if (!isAdmin && (cart.user.id != ctx.state.user.id)) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.cart.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.services.cart.update({ id }, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.models.cart });
  },

  
 /**
   * Delete a record.
   *
   * @return {Object}
   */

  async delete(ctx) {
    const { id } = ctx.params;
    let isAdmin = false;

    if (ctx.state.user.role.type == "Admin") {
        isAdmin = true;
    }

    const [cart] = await strapi.services.cart.find({
      id: ctx.params.id
    });

    if (!isAdmin && (cart.user.id != ctx.state.user.id)) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    const entity = await strapi.services.cart.delete({ id });
    return sanitizeEntity(entity, { model: strapi.models.cart });
  },

   /**
   * Retrieve records.
   *
   * @return {Array}
   */

  async find(ctx) {
    const { id } = ctx.state.user;
    
    let entities;
    ctx.query.user = id;
    if (ctx.query._q) {
      entities = await strapi.services.cart.search(ctx.query);
    } else {
      entities = await strapi.services.cart.find(ctx.query);
    }

    return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.cart }));
  },


    /**
     * Retrieve a record.
     *
     * @return {Object}
     */
  
    async findOne(ctx) {
      const { id } = ctx.params;
    
      const entity = await strapi.services.cart.findOne({ id: id , user: ctx.state.user.id });
      return sanitizeEntity(entity, { model: strapi.models.cart });
    },

    /**
   * Count records.
   *
   * @return {Number}
   */

  count(ctx) {
    if (ctx.query._q) {
      return strapi.services.cart.countSearch(ctx.query);
    }
    return strapi.services.cart.count(ctx.query);
  },
};


