/**
 * ImperviousAreaController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  index: function (req, res) {
    imperviousArea.find().exec((err, imperviousArea) => {
      if (err) {
        res.send(500, { error: 'Database error' });
      }
      res.view('imperviousArea/index', { imperviousArea: imperviousArea });
    });
  },
};
