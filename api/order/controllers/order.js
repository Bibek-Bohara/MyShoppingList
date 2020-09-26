
"use strict";
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
/**
 * Order.js controller
 *
 * @description: A set of functions called "actions" for managing `Order`.
 */

const stripe = require("stripe")("sk_test_51HRKj6LPVmcKPAah4agFpBKY7rjLtinOCItYNYfSSf6RagNVYw5xCoh5brux3ydFNwriuhdgl07UoUB97hCWcyEk00hqdUX4Cu");

module.exports = {


  /**
   * Create a/an order record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    console.log(ctx.request.body);
    const { Address, City, payment_method_id } = ctx.request.body

    var amount = 0;
    var email = '';
    try {
      const carts = await strapi.services.cart.find({ user: ctx.state.user.id });
      email = carts[0].user.email;
      carts.forEach(element => {
        amount += element.product.price * element.count
        delete element["user"];
      });
      const stripeAmount = Math.floor(amount * 100);
      // charge on stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: 'aud',
        payment_method_types: ['card'],
        payment_method: payment_method_id,
        receipt_email: email,
        confirm: true
      }, {
        stripeAccount: 'acct_1HRektGrGyr9XZMS',
      }
      );

      console.log(paymentIntent);
      // Register the order in the database

      const order = await strapi.services.order.create({
        user: ctx.state.user.id,
        charge_id: paymentIntent.id,
        amount: amount,
        Address: Address,
        product: carts,
        City: City,
      });
      const entity = await strapi.services.cart.delete({ user: ctx.state.user.id });
      return paymentIntent.client_secret
    } catch (e) {
      console.log(e);
      return e;
    }
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

    const [order] = await strapi.services.order.find({
      id: ctx.params.id
    });

    if (!isAdmin && (order.user.id != ctx.state.user.id)) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.order.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.services.order.update({ id }, { Address: ctx.request.body.Address, City: ctx.request.body.City});
    }

    return sanitizeEntity(entity, { model: strapi.models.order });
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
      entities = await strapi.services.order.search(ctx.query);
    } else {
      entities = await strapi.services.order.find(ctx.query);
    }

    return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.order }));
  },

};
