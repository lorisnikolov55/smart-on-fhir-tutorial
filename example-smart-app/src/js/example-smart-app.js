(function (window) {

  /***** Data fetching function *****/
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
            var vaccineCode = undefined;
            var vaccineManufacturer = undefined;
            var vaccineStatus = undefined;
            var doseQuantity = undefined;
            var dateGiven = undefined;
            var expiryDate = undefined;

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

            if (jsonData.entry[0].resource.hasOwnProperty("status")) {
              if (typeof jsonData.entry[0].resource.status !== undefined) {
                vaccineStatus = jsonData.entry[0].resource.status;
                console.log(vaccineStatus);
              } else {
                vaccineStatus = "NA";
                console.log(vaccineStatus);
              }
            } else {
              vaccineStatus = "NA";
              console.log(vaccineStatus);
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

            $.when(pt).fail(onError);

            $.when(pt).done(function (patient) {
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

              ret.resolve(p);
            });
          });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();
  };

  /***** Patient object definition *****/
  function defaultPatient() {
    return {
      // Patient data
      fname: { value: "" },
      lname: { value: "" },
      gender: { value: "" },
      birthdate: { value: "" },

      // Immunization data
      vCode: { value: "" },
      vManufacturer: { value: "" },
      vStatus: { value: "" },
      vDoseQuantity: { value: "" },
      vDateGiven: { value: "" },
      vExpiryDate: { value: "" },
    };
  }

  /***** HTML indexing *****/
  window.drawVisualization = function (p) {
    // Patient data
    $("#holder").show();
    $("#loading").hide();
    $("#fname").html(p.fname);
    $("#lname").html(p.lname);
    $("#gender").html(p.gender);
    $("#birthdate").html(p.birthdate);

    //Immunization data
    $("#type").html(p.vCode);
    $("#manufacturer").html(p.vManufacturer);
    $("#status").html(p.vStatus);
    $("#quantity").html(p.vDoseQuantity);
    $("#dateGiven").html(p.vDateGiven);
    $("#expiryDate").html(p.vExpiryDate);
  };
})(window);
