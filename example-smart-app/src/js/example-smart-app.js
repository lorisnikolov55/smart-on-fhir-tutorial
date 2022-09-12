(function (window) {
  window.extractData = function () {
    var ret = $.Deferred();

    function onError() {
      console.log("Loading error", arguments);
      ret.reject();
    }

    function onReady(smart) {
      if (smart.hasOwnProperty("patient")) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
          type: "Observation",
          query: {
            code: {
              $or: [
                "http://loinc.org|8302-2",
                "http://loinc.org|8462-4",
                "http://loinc.org|8480-6",
                "http://loinc.org|2085-9",
                "http://loinc.org|2089-1",
                "http://loinc.org|55284-4",
                "http://loinc.org|3141-9",
              ],
            },
          },
        });

        var vaccineCode = undefined;
        var vaccineManufacturer = undefined;
        var vaccineStatus = undefined;
        var doseQuantity = undefined;
        var dateGiven = undefined;
        var expiryDate = undefined;

        const uri =
          "https://fhir-open.cerner.com/dstu2/ec2458f2-1e24-41c8-b71b-0e701af7583d/Immunization?patient=" +
          String(patient.id);
        console.log(uri);
        let h = new Headers();
        h.append("Accept", "application/json+fhir");

        let req = new Request(uri, {
          method: "GET",
          headers: h,
          mode: "cors",
        });

        fetch(req)
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error("Bad HTTP stuff!");
            }
          })
          .then((jsonData) => {
            console.log(jsonData.entry[0]);

            if (jsonData.entry[0].resource.hasOwnProperty("vaccineCode")) {
              if (
                typeof jsonData.entry[0].resource.vaccineCode.text !== undefined
              ) {
                vaccineCode = jsonData.entry[0].resource.vaccineCode.text;
                console.log(vaccineCode);
              } else {
                vaccineCode = "NA";
                console.log(vaccineCode);
              }
            } else {
              vaccineCode = "NA";
              console.log(vaccineCode);
            }

            if (jsonData.entry[0].resource.hasOwnProperty("manufacturer")) {
              if (
                typeof jsonData.entry[0].resource.manufacturer.display !==
                undefined
              ) {
                vaccineManufacturer =
                  jsonData.entry[0].resource.manufacturer.display;
                console.log(vaccineManufacturer);
              } else {
                vaccineManufacturer = "NA";
                console.log(vaccineManufacturer);
              }
            } else {
              vaccineManufacturer = "NA";
              console.log(vaccineManufacturer);
            }

            if (jsonData.entry[0].resource.hasOwnProperty("doseQuantity")) {
              if (
                typeof String(jsonData.entry[0].resource.doseQuantity.value) ||
                jsonData.entry[0].resource.doseQuantity.unit !== "undefined" ||
                jsonData.entry[0].resource.doseQuantity.unit !== "unknown unit"
              ) {
                doseQuantity =
                  String(jsonData.entry[0].resource.doseQuantity.value) +
                  " " +
                  jsonData.entry[0].resource.doseQuantity.unit;
                console.log(doseQuantity);
              } else {
                doseQuantity = "NA";
                console.log(doseQuantity);
              }
            } else {
              doseQuantity = "NA";
              console.log(doseQuantity);
            }

            if (jsonData.entry[0].resource.hasOwnProperty("date")) {
              if (typeof jsonData.entry[0].resource.date !== undefined) {
                dateGiven = jsonData.entry[0].resource.date;
                console.log(dateGiven);
              } else {
                dateGiven = "NA";
                console.log(dateGiven);
              }
            } else {
              dateGiven = "NA";
              console.log(dateGiven);
            }

            if (jsonData.entry[0].resource.hasOwnProperty("expirationDate")) {
              if (
                typeof jsonData.entry[0].resource.expirationDate !== undefined
              ) {
                expiryDate = jsonData.entry[0].resource.expirationDate;
                console.log(expiryDate);
              } else {
                expiryDate = "NA";
                console.log(expiryDate);
              }
            } else {
              expiryDate = "NA";
              console.log(expiryDate);
            }

            //vaccineCode = jsonData.entry[0].resource.vaccineCode.text;
            //vaccineManufacturer = jsonData.entry[0].resource.manufacturer.display;
            //vaccineStatus = jsonData.entry[0].resource.status;
            //doseQuantity =
            // String(jsonData.entry[0].resource.doseQuantity.value) +
            //  " " +
            //  jsonData.entry[0].resource.doseQuantity.unit;
            //dateGiven = jsonData.entry[0].resource.date;
            //expiryDate = jsonData.entry[0].resource.expirationDate;

            //console.log(jsonData.entry[0].resource.vaccineCode.text);
            //console.log(jsonData.entry[0].resource.manufacturer.display); /
            //console.log(jsonData.entry[0].resource.status);
            //console.log(String(jsonData.entry[0].resource.doseQuantity.value)+" "+jsonData.entry[0].resource.doseQuantity.unit);
            //console.log(jsonData.entry[0].resource.date);
            //console.log(expiryDate = jsonData.entry[0].resource.expirationDate);
          });
        //.catch((err) => {
        //  console.log("ERROR: ", err.message);
        //});

        $.when(pt, obv).fail(onError);

        $.when(pt, obv).done(function (patient, obv) {
          var byCodes = smart.byCodes(obv, "code");
          var gender = patient.gender;
          var dob = new Date(patient.birthDate);
          var day = dob.getDate();
          var monthIndex = dob.getMonth() + 1;
          var year = dob.getFullYear();

          var dobStr = monthIndex + "/" + day + "/" + year;
          var fname = "";
          var lname = "";

          if (typeof patient.name[0] !== "undefined") {
            fname = patient.name[0].given.join(" ");
            lname = patient.name[0].family.join(" ");
          }

          var height = byCodes("8302-2");
          var weight = byCodes("3141-9");
          var systolicbp = getBloodPressureValue(byCodes("55284-4"), "8480-6");
          var diastolicbp = getBloodPressureValue(byCodes("55284-4"), "8462-4");
          var hdl = byCodes("2085-9");
          var ldl = byCodes("2089-1");

          var p = defaultPatient();
          p.birthdate = dobStr;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          // Immunizations
          p.vCode = vaccineCode;
          p.vManufacturer = vaccineManufacturer;
          p.vStatus = vaccineStatus;
          p.vDoseQuantity = doseQuantity;
          p.vDateGiven = dateGiven;
          p.vExpiryDate = expiryDate;

          if (
            typeof height[0] != "undefined" &&
            typeof height[0].valueQuantity.value != "undefined" &&
            typeof height[0].valueQuantity.unit != "undefined"
          ) {
            p.height =
              height[0].valueQuantity.value +
              " " +
              height[0].valueQuantity.unit;
          }

          if (
            typeof weight[0] != "undefined" &&
            typeof weight[0].valueQuantity.value != "undefined" &&
            typeof weight[0].valueQuantity.unit != "undefined"
          ) {
            p.weight =
              weight[0].valueQuantity.value +
              " " +
              weight[0].valueQuantity.unit;
          }

          if (typeof systolicbp != "undefined") {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != "undefined") {
            p.diastolicbp = diastolicbp;
          }

          if (
            typeof hdl[0] != "undefined" &&
            typeof hdl[0].valueQuantity.value != "undefined" &&
            typeof hdl[0].valueQuantity.unit != "undefined"
          ) {
            p.hdl =
              hdl[0].valueQuantity.value + " " + hdl[0].valueQuantity.unit;
          }

          if (
            typeof ldl[0] != "undefined" &&
            typeof ldl[0].valueQuantity.value != "undefined" &&
            typeof ldl[0].valueQuantity.unit != "undefined"
          ) {
            p.ldl =
              ldl[0].valueQuantity.value + " " + ldl[0].valueQuantity.unit;
          }

          /*if (
            typeof vaccineCode !== "undefined"
          ) {
            console.log(vaccineCode);
            p.vCode = vaccineCode;
          }

          if (
            typeof vaccineManufacturer !== "undefined"
          ) {
            console.log(vaccineManufacturer);
            p.vManufacturer = vaccineManufacturer;
          }

          if (
            typeof vaccineStatus !== "undefined"
          ) {
            console.log(vaccineStatus);
            p.vStatus = vaccineStatus;
          }

          if (
            typeof doseQuantity !== "undefined"
          ) {
            console.log(doseQuantity);
            p.vDoseQuantity = doseQuantity;
          }

          if (
            typeof dateGiven !== "undefined"
          ) {
            console.log(dateGiven);
            p.vDateGiven = dateGiven;
          }
          
          if (
            typeof expiryDate !== "undefined"
          ) {
            console.log(expiryDate);
            p.vExpiryDate = expiryDate;
          }*/

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();
  };

  function defaultPatient() {
    return {
      fname: { value: "" },
      lname: { value: "" },
      gender: { value: "" },
      birthdate: { value: "" },
      // lymph: {value: ''}

      // Cerner SoF Tutorial Observations
      height: { value: "" },
      weight: { value: "" },
      systolicbp: { value: "" },
      diastolicbp: { value: "" },
      ldl: { value: "" },
      hdl: { value: "" },

      //Immunization data
      vCode: { value: "" },
      vManufacturer: { value: "" },
      vStatus: { value: "" },
      vDoseQuantity: { value: "" },
      vDateGiven: { value: "" },
      vExpiryDate: { value: "" },
    };
  }

  // Helper Function

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function (observation) {
      var BP = observation.component.find(function (component) {
        return component.code.coding.find(function (coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (
      typeof ob != "undefined" &&
      typeof ob.valueQuantity != "undefined" &&
      typeof ob.valueQuantity.value != "undefined" &&
      typeof ob.valueQuantity.unit != "undefined"
    ) {
      return ob.valueQuantity.value + " " + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function (p) {
    $("#holder").show();
    $("#loading").hide();
    $("#fname").html(p.fname);
    $("#lname").html(p.lname);
    $("#gender").html(p.gender);
    $("#birthdate").html(p.birthdate);
    //$('#lymph').html(p.lymph);

    // Cerner SoF Tutorial Observations

    $("#height").html(p.height);
    $("#weight").html(p.weight);
    $("#systolicbp").html(p.systolicbp);
    $("#diastolicbp").html(p.diastolicbp);
    $("#ldl").html(p.ldl);
    $("#hdl").html(p.hdl);

    //Immunization data
    $("#type").html(p.vCode);
    $("#manufacturer").html(p.vManufacturer);
    $("#status").html(p.vStatus);
    $("#quantity").html(p.vDoseQuantity);
    $("#dateGiven").html(p.vDateGiven);
    $("#expiryDate").html(p.vExpiryDate);
  };
})(window);
