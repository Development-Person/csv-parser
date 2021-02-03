/**
 * TreatmentRowController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const fastcsv = require('fast-csv');

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

  parse: async function (req, res) {
    //fastcsv has been imported above
    //using https://www.npmjs.com/package/sails-hook-uploads instead of the regular req.file().upload() because it supports async/await

    //bringing in the file
    let file = req.file('uploadfile');

    //setting up the upload stream
    let upload = await sails
      .uploadOne(file, {
        maxBytes: 3000000,
      })
      .intercept('E_EXCEEDS_UPLOAD_LIMIT', 'tooBig')
      .intercept((err) => new Error('The upload failed: ' + util.inspect(err)));

    //file is now uploaded in .tmp/uploads, we can now obtain the filepath
    let filePath = upload.fd;

    //wrapping the fast-csv function in a Promise so that we can return an array containing the data from the csv file
    const fileParser = () =>
      new Promise((resolve) => {
        let array = [];
        fastcsv
          .parseFile(filePath, { headers: true }) //will ignore first row
          .on('data', (data) => {
            array.push(data);
          })
          .on('end', () => {
            resolve(array);
          });
      });

    //await the fileParser function so that we can obtain an array containing an object representing each row in the csv file
    let csvData = await fileParser();

    // using a for loop to populate the database with each object in the array
    //this is basically a copy of the upload function so can be made DRY
    for (let i = 0; i < csvData.length; i++) {
      let treatmenttypecsv = csvData[i].treatmentType;
      let treatmentsizecsv = csvData[i].treatmentSize;
      let projectnamecsv = csvData[i].projectName;
      let locationcsv = csvData[i].rainfallStation;
      let imperviousnamecsv = csvData[i].imperviousAreaName;
      let impervioustypecsv = csvData[i].imperviousAreaType;

      try {
        //for treatment row: bringing in the new treatment row data from the form
        const newTreatmentRowData = {
          treatmentRowProject: projectnamecsv,
        };

        //for treatment row: creating the new treatment row and returning the created data
        let treatmentRowToCreate = await treatmentRow
          .create(newTreatmentRowData)
          .fetch();

        //bringing in the relevant data (form & treatment row ID) for treatment, rainfall station and impervious area
        const newTreatmentData = {
          treatmentRow: treatmentRowToCreate.id,
          treatmentType: treatmenttypecsv,
          treatmentSize: treatmentsizecsv,
        };
        const newLocationData = {
          treatmentRow: treatmentRowToCreate.id,
          location: locationcsv,
        };
        const newImperviousAreaData = {
          treatmentRow: treatmentRowToCreate.id,
          areaName: imperviousnamecsv,
          areaType: impervioustypecsv,
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
      } catch (err) {
        return res.serverError(err);
      }
    }
    //redirecting to the treatment row view so that user can see created row
    res.redirect('/treatmentRow/index');
  },
};
