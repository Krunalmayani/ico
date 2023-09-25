function validateForm() {
    var firstName = document.forms["kycForm"]["First_Name"].value;
    var lastName = document.forms["kycForm"]["Last_Name"].value;
    var phoneNumber = document.forms["kycForm"]["Phone"].value;
    var dateOfBirth = document.forms["kycForm"]["DOB"].value;
    var addressLine1 = document.forms["kycForm"]["Address_1"].value;
    var city = document.forms["kycForm"]["City"].value;
    var state = document.forms["kycForm"]["State"].value;
    var nationality = document.forms["kycForm"]["Nationality"].value;
    var zipCode = document.forms["kycForm"]["Zip_Code"].value;
    if (firstName === "") {
        alert("First Name is required");
        return false;
    }
    if (lastName === "") {
        alert("Last Name is required");
        return false;
    }
    if (phoneNumber === "") {
        alert("Phone Number is required");
        return false;
    }
    if (dateOfBirth === "") {
        alert("Date of Birth is required");
        return false;
    }
    if (addressLine1 === "") {
        alert("Address Line 1 is required");
        return false;
    }
    if (city === "") {
        alert("City is required");
        return false;
    }
    if (state === "") {
        alert("State is required");
        return false;
    }
    if (nationality === "") {
        alert("Please select Nationality");
        return false;
    }
    if (zipCode === "") {
        alert("Zip Code is required");
        return false;
    }

    return true; 
}

