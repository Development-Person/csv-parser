/**
 * TreatmentController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  index: function (req, res) {
    treatment.find().exec((err, treatment) => {
      if (err) {
        res.send(500, { error: 'Database error' });
      }
      res.view('treatment/index', {
        treatment: treatment,
      });
    });
  },
};
