/**
 * TreatmentRowController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

// const fastcsv = require('fast-csv');

module.exports = {
  index: async function (req, res) {
    try {
      var data = await treatmentRow
        .find()
        .populate('treatment')
        .populate('imperviousArea')
        .populate('rainfallStation');

      res.view('treatmentRow/index', { treatmentRow: data });
    } catch (err) {
      return res.serverError(err);
    }
  },

  // add: function (req, res) {
  //   res.view('add');
  // },

  create: async function (req, res) {
    //setting variables for each part of the form
    let treatmenttype = req.body.treatmenttype;
    let treatmentsize = req.body.treatmentsize;
    let projectname = req.body.projectname;
    let location = req.body.rainfallstation;
    let imperviousname = req.body.imperviousareaname;
    let impervioustype = req.body.imperviousareatype;

    try {
      //for treatment row: bringing in the new treatment row data from the form
      const newTreatmentRowData = {
        treatmentRowProject: projectname,
      };

      //for treatment row: creating the new treatment row and returning the created data
      let treatmentRowToCreate = await treatmentRow
        .create(newTreatmentRowData)
        .fetch();

      //bringing in the relevant data (form & treatment row ID) for treatment, rainfall station and impervious area
      const newTreatmentData = {
        treatmentRow: treatmentRowToCreate.id,
        treatmentType: treatmenttype,
        treatmentSize: treatmentsize,
      };
      const newLocationData = {
        treatmentRow: treatmentRowToCreate.id,
        location: location,
      };
      const newImperviousAreaData = {
        treatmentRow: treatmentRowToCreate.id,
        areaName: imperviousname,
        areaType: impervioustype,
      };

      //creating the treatment, rainfall station and impervious area entries
      const treatmentToCreate = await treatment
        .create(newTreatmentData)
        .fetch();
      const locationToCreate = await rainfallStation
        .create(newLocationData)
        .fetch();
      const imperviousToCreate = await imperviousArea
        .create(newImperviousAreaData)
        .fetch();

      //for treatment row: bringing in the ID from the returned data for treatment, rainfall station and impervious area
      let updateTreatmentRowData = {
        treatment: treatmentToCreate.id,
        rainfallStation: locationToCreate.id,
        imperviousArea: imperviousToCreate.id,
      };

      //for treatment row: updating the treatment row to refer to the treatment_id
      await treatmentRow
        .updateOne(treatmentRowToCreate)
        .set(updateTreatmentRowData);

      //redirecting to the treatment row view so that user can see created row
      return res.redirect('/treatmentRow/index');
    } catch (err) {
      return res.serverError(err);
    }
  },

  upload: function (req, res) {
    // e.g.
    // 0 => infinite
    // 240000 => 4 minutes (240,000 miliseconds)
    // etc.
    //
    // Node defaults to 2 minutes.
    res.setTimeout(0);

    req.file('uploadfile').upload(
      {
        // You can apply a file upload limit (in bytes)
        maxBytes: 1000000,
      },
      function whenDone(err, uploadedFiles) {
        if (err) {
          return res.serverError(err);
        } else {
          return res.json({
            files: uploadedFiles,
            textParams: req.allParams(),
          });
        }
      }
    );
  },
};
