function ViewModel() {
    var self = this;

    var tokenKey = 'accessToken';

    self.result = ko.observable();
    self.user = ko.observable();

    self.registerEmail = ko.observable();
    self.registerPassword = ko.observable();
    self.registerPassword2 = ko.observable();

    self.loginEmail = ko.observable();
    self.loginPassword = ko.observable();
    self.errors = ko.observableArray([]);

    self.registerButton = ko.observable('Register');
    self.isRegisterLoading = ko.observable(true);

    function showError(jqXHR) {

        self.result(jqXHR.status + ': ' + jqXHR.statusText);

        var response = jqXHR.responseJSON;
        if (response) {
            if (response.Message) self.errors.push(response.Message);
            if (response.ModelState) {
                var modelState = response.ModelState;
                for (var prop in modelState) {
                    if (modelState.hasOwnProperty(prop)) {
                        var msgArr = modelState[prop]; // expect array here
                        if (msgArr.length) {
                            for (var i = 0; i < msgArr.length; ++i) self.errors.push(msgArr[i]);
                        }
                    }
                }
            }
            if (response.error) self.errors.push(response.error);
            if (response.error_description) self.errors.push(response.error_description);
        }
    }

    self.callApi = function () {
        self.result('');
        self.errors.removeAll();

        var token = sessionStorage.getItem(tokenKey);
        var headers = {};
        if (token) {
            headers.Authorization = 'Bearer ' + token;
        }

        $.ajax({
            type: 'GET',
            url: '/api/values',
            headers: headers
        }).done(function (data) {
            self.result(data);
        }).fail(showError);
    }

    self.register = function () {
        self.result('');
        self.errors.removeAll();

        addValidationMethods();
        //Validate form before submitting
        $('#registerForm').validate({
            rules: {
                registerEmail: {
                    required: true,
                    email: true
                },
                registerPassword: {
                    required: true,
                    checkLower: true,
                    checkUpper: true,
                    checkDigit: true,
                    checkSpecial: true,
                    minlength: 6
                },
                registerPassword2: {
                    required: true,
                    equalTo: '[name="registerPassword"]'
                }
            },
            messages: {
                registerEmail: {
                    required: "Please enter an Email Address",
                    email: "Please enter a valid Email Address"
                },
                registerPassword: {
                    required: "Please enter a Password",
                    checkLower: "Password must have at least 1 lowercase letter ('a'-'z').",
                    checkUpper: "Password must have at least 1 uppercase letter ('A'-'Z').",
                    checkDigit: "Password must have at least 1 digit ('0'-'9').",
                    checkSpecial: "Password must have at least 1 special character.",
                    minlength: "Password must have at least 6 characters."
                },
                registerPassword2: {
                    required: "Please confirm your Password",
                    equalTo: "Passwords do not match."
                }
            }
        })

        if ($('#registerForm').valid()) {
            //Disable and turn Register button to loading with spinner 
            self.isRegisterLoading(false);
            self.registerButton('<i class="fa fa-refresh fa-spin"></i>Loading');


            grecaptcha.ready(function () {
                grecaptcha.execute('6LcesxoaAAAAALyQ9n7qpT1LBOYdbhh7cuj-VKKY', { action: 'register' }).then(function (token) {

                    var data = {
                        Email: self.registerEmail(),
                        Password: self.registerPassword(),
                        ConfirmPassword: self.registerPassword2(),
                        GoogleCaptchaToken: token
                    };

                    $.ajax({
                        type: 'POST',
                        url: '/api/Account/Register',
                        contentType: 'application/json; charset=utf-8',
                        data: JSON.stringify(data)
                    }).done(function (data) {
                        self.result("Done!");
                        self.isRegisterLoading(true);
                        self.registerButton('Register');
                    }).fail(function (err) {
                        showError(err);
                        self.isRegisterLoading(true);
                        self.registerButton('Register');
                    });

                });
            });
        }
    }

    self.login = function () {
        self.result('');
        self.errors.removeAll();

        var loginData = {
            grant_type: 'password',
            username: self.loginEmail(),
            password: self.loginPassword()
        };

        $.ajax({
            type: 'POST',
            url: '/Token',
            data: loginData
        }).done(function (data) {
            self.user(data.userName);
            // Cache the access token in session storage.
            sessionStorage.setItem(tokenKey, data.access_token);
        }).fail(showError);
    }

    self.logout = function () {
        // Log out from the cookie based logon.
        var token = sessionStorage.getItem(tokenKey);
        var headers = {};
        if (token) {
            headers.Authorization = 'Bearer ' + token;
        }

        $.ajax({
            type: 'POST',
            url: '/api/Account/Logout',
            headers: headers
        }).done(function (data) {
            // Successfully logged out. Delete the token.
            self.user('');
            sessionStorage.removeItem(tokenKey);
        }).fail(showError);
    }

    function addValidationMethods() {
        $.validator.addMethod("checkLower", function (value) {
            return /[a-z]/.test(value);
        });
        $.validator.addMethod("checkUpper", function (value) {
            return /[A-Z]/.test(value);
        });
        $.validator.addMethod("checkDigit", function (value) {
            return /[0-9]/.test(value);
        });
        $.validator.addMethod("checkSpecial", function (value) {
            return /[!@#$%^&*(),.?":{}|<>]/.test(value);
        });
    }

}

var app = new ViewModel();
ko.applyBindings(app);