const mongoose = require("mongoose");
const TaskSchema = new mongoose.Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
},
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  task: {
    type: String,
    required: true,
  },

});
const Tasks = mongoose.model("Tasks", TaskSchema);
module.exports = Tasks;
