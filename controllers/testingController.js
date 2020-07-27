const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const pool = require("../middleware/database");

exports.getAllExperiments = catchAsync(async (req, res, next) => {
  let query = `Select exp.id, exp.description, exp.created, seg.description as segment, seg.rolloutPercent, con.defined_prop, con.valid_operator, con.prop_value, var.vKey, varD.distribution From experiments exp 
                LEFT JOIN segments seg ON seg.exp_id = exp.id 
                LEFT JOIN constraints con ON con.exp_id = exp.id AND con.seg_id = seg.id
                LEFT JOIN variants var ON var.exp_id = exp.id
                LEFT JOIN variant_distributions varD ON varD.seg_id = seg.id AND varD.var_id = var.id
                Where exp.flag = 1 AND seg.flag = 1 AND var.flag = 1 AND con.flag = 1`;

  const data = await pool.query(query);

  if (data.length <= 0) {
    return next(new AppError("No Experiment found!!!", 404));
  }

  res.status(200).json({
    status: "success",
    data,
  });
});

exports.getExperiment = catchAsync(async (req, res, next) => {
  const exp_key = req.params.id;
  let query = `Select  exp.id, exp.description, exp.created, seg.description as segment, seg.rolloutPercent, con.defined_prop, con.valid_operator, con.prop_value,var.vKey, varD.distribution  From experiments exp 
                JOIN segments seg ON seg.exp_id = exp.id 
                LEFT JOIN constraints con ON con.exp_id = exp.id AND con.seg_id = seg.id
                LEFT JOIN variants var ON var.exp_id = exp.id
                LEFT JOIN variant_distributions varD ON varD.var_id = var.id 
                Where exp.flag = 1 AND seg.flag = 1 AND var.flag = 1 AND con.flag = 1 AND exp.id = ${exp_key}`;

  const data = await pool.query(query);

  if (data.length <= 0) {
    return next(new AppError("No Experiment found!!!", 404));
  }

  res.status(200).json({
    status: "success",
    data,
  });
});

exports.createExperiment = catchAsync(async (req, res, next) => {
  let expDesc = req.body.exp_desc;

  let query = `SELECT description FROM experiments where description = "${expDesc}" AND flag = 1`;

  const expExist = await pool.query(query);

  if (expExist.length > 0) {
    return next(new AppError("Experiment Exist!!!", 404));
  }

  // EXperiments
  query = `INSERT INTO experiments (description) VALUES ("${expDesc}")`;
  const insertExp = await pool.query(query);

  res.status(200).json({
    status: "success",
    data: insertExp,
  });
});

exports.createSegment = catchAsync(async (req, res, next) => {
  let exp_id = req.query.exp_id;
  let query = `SELECT description FROM experiments where id = "${exp_id}" AND flag = 1`;
  const expExist = await pool.query(query);

  let segDesc = req.body.seg_desc;
  let segRollOut = req.body.seg_rollout;
  let definedProp = req.body.defined_prop;
  let validOperator = req.body.valid_operator;
  let propValue = req.body.prop_value;

  if (expExist.length > 0) {
    query = `INSERT INTO segments (exp_id, description, rolloutPercent) VALUES ("${exp_id}", "${segDesc}", "${segRollOut}")`;
    const insertSeg = await pool.query(query);
    const lastSegId = insertSeg["insertId"];

    query = `INSERT INTO constraints (exp_id, seg_id, defined_prop, valid_operator, prop_value) VALUES ("${exp_id}", "${lastSegId}", "${definedProp}","${validOperator}","${propValue}")`;
    await pool.query(query);
  } else {
    return next(new AppError("Please create an Experiment!!!", 404));
  }

  res.status(200).json({
    status: "success",
  });
});

exports.createVariant = catchAsync(async (req, res, next) => {
  let exp_id = req.query.exp_id;
  let seg_id = req.query.seg_id;

  let query = `SELECT description FROM experiments where id = "${exp_id}" AND flag = 1`;
  const expExist = await pool.query(query);

  let vKeys = req.body.vkeys.split(",");
  let vAttachments = req.body.vattachments.split(",");
  let vDistribution = req.body.vdistribution.split(",");

  if (expExist.length > 0) {
    vKeys.forEach((item, index) => {
      query = `INSERT INTO variants (exp_id, seg_id, vKey, vAttachment) VALUES ("${exp_id}", "${seg_id}", "${item}", "${vAttachments[index]}")`;
      pool
        .query(query)
        .then((insertVar) => {
          return insertVar["insertId"];
        })
        .then((lastVarId) => {
          query = `INSERT INTO variant_distributions (seg_id, var_id, distribution) VALUES ("${seg_id}", "${lastVarId}", "${vDistribution[index]}")`;
          pool.query(query);
        });
    });
  } else {
    return next(new AppError("Please create an Experiment!!!", 404));
  }

  res.status(200).json({
    status: "success",
  });
});
