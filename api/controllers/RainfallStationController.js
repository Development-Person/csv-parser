/**
 * RainfallStationController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  index: function (req, res) {
    rainfallStation.find().exec((err, rainfallStation) => {
      if (err) {
        res.send(500, { error: 'Database error' });
      }
      res.view('rainfallStation/index', { rainfallStation: rainfallStation });
    });
  },
};
