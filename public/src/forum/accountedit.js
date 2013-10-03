define(['forum/accountheader'], function(header) {
	var AccountEdit = {};

	AccountEdit.init = function() {
		header.init();

		var gravatarPicture = templates.get('gravatarpicture');
		var uploadedPicture = templates.get('uploadedpicture');

		$('#uploadForm').submit(function() {
			AccountEdit.status('uploading the file ...');

			$('#upload-progress-bar').css('width', '0%');
			$('#upload-progress-box').show();
			$('#upload-progress-box').removeClass('hide');

			if (!$('#userPhotoInput').val()) {
				AccountEdit.error('select an image to upload!');
				return false;
			}

			$(this).find('#imageUploadCsrf').val($('#csrf_token').val());


			$(this).ajaxSubmit({

				error: function(xhr) {
					AccountEdit.error('Error: ' + xhr.status);
				},

				uploadProgress: function(event, position, total, percent) {
					console.log(percent);
					$('#upload-progress-bar').css('width', percent + '%');
				},


				success: function(response) {
					if (response.error) {
						AccountEdit.error(response.error);
						return;
					}

					var imageUrlOnServer = response.path;

					$('#user-current-picture').attr('src', imageUrlOnServer);
					$('#user-uploaded-picture').attr('src', imageUrlOnServer);

					uploadedPicture = imageUrlOnServer;

					setTimeout(function() {
						AccountEdit.hideAlerts();
						$('#upload-picture-modal').modal('hide');
					}, 750);

					socket.emit('api:updateHeader', {
						fields: ['username', 'picture', 'userslug']
					});
					AccountEdit.success('File uploaded successfully!');
				}
			});

			return false;
		});

		var selectedImageType = '';

		$('#submitBtn').on('click', function() {

			var userData = {
				uid: $('#inputUID').val(),
				email: $('#inputEmail').val(),
				fullname: $('#inputFullname').val(),
				website: $('#inputWebsite').val(),
				birthday: $('#inputBirthday').val(),
				location: $('#inputLocation').val(),
				signature: $('#inputSignature').val()
			};

			socket.emit('api:user.updateProfile', userData, function(err, data) {
				if (data.success) {
					app.alertSuccess('Your profile has been updated successfully!');
					if (data.picture) {
						$('#user-current-picture').attr('src', data.picture);
						$('#user_label img').attr('src', data.picture);
					}
					if (data.gravatarpicture) {
						$('#user-gravatar-picture').attr('src', data.gravatarpicture);
						gravatarPicture = data.gravatarpicture;
					}
				} else {
					app.alertError('There was an error updating your profile! ' + err.error);
				}
			});
			return false;
		});

		$('#changePictureBtn').on('click', function() {
			selectedImageType = '';
			AccountEdit.updateImages();

			$('#change-picture-modal').modal('show');
			$('#change-picture-modal').removeClass('hide');

			return false;
		});

		$('#gravatar-box').on('click', function() {
			$('#gravatar-box .icon-ok').show();
			$('#uploaded-box .icon-ok').hide();
			selectedImageType = 'gravatar';
		});

		$('#uploaded-box').on('click', function() {
			$('#gravatar-box .icon-ok').hide();
			$('#uploaded-box .icon-ok').show();
			selectedImageType = 'uploaded';
		});

		$('#savePictureChangesBtn').on('click', function() {
			$('#change-picture-modal').modal('hide');

			if (selectedImageType) {
				AccountEdit.changeUserPicture(selectedImageType);

				if (selectedImageType == 'gravatar')
					$('#user-current-picture').attr('src', gravatarPicture);
				else if (selectedImageType == 'uploaded')
					$('#user-current-picture').attr('src', uploadedPicture);
			}

		});

		$('#upload-picture-modal').on('hide', function() {
			$('#userPhotoInput').val('');
		});

		$('#uploadPictureBtn').on('click', function() {

			$('#change-picture-modal').modal('hide');
			$('#upload-picture-modal').modal('show');
			$('#upload-picture-modal').removeClass('hide');

			AccountEdit.hideAlerts();

			return false;
		});

		$('#pictureUploadSubmitBtn').on('click', function() {
			$('#uploadForm').submit();
		});

		(function handlePasswordChange() {
			var currentPassword = $('#inputCurrentPassword');
			var password_notify = $('#password-notify');
			var password_confirm_notify = $('#password-confirm-notify');
			var password = $('#inputNewPassword');
			var password_confirm = $('#inputNewPasswordAgain');
			var passwordvalid = false;
			var passwordsmatch = false;


			function onPasswordChanged() {
				passwordvalid = utils.isPasswordValid(password.val());
				if (password.val().length < config.minimumPasswordLength) {
					password_notify.html('Password too short');
					password_notify.attr('class', 'alert alert-danger');
					password_notify.removeClass('hide');
				} else if (!passwordvalid) {
					password_notify.html('Invalid password');
					password_notify.attr('class', 'alert alert-danger');
					password_notify.removeClass('hide');
				} else {
					password_notify.html('OK!');
					password_notify.attr('class', 'alert alert-success');
					password_notify.removeClass('hide');
				}

				onPasswordConfirmChanged();
			}

			function onPasswordConfirmChanged() {
				if (password_notify.hasClass('alert-danger') || !password_confirm.val()) {
					password_confirm_notify.addClass('hide');
					return;
				}
				if (password.val() !== password_confirm.val()) {
					password_confirm_notify.html('Passwords must match!');
					password_confirm_notify.attr('class', 'alert alert-danger');
					password_confirm_notify.removeClass('hide');
					passwordsmatch = false;
				} else {
					password_confirm_notify.html('OK!');
					password_confirm_notify.attr('class', 'alert alert-success');
					password_confirm_notify.removeClass('hide');
					passwordsmatch = true;
				}
			}

			password.on('blur', onPasswordChanged);
			password_confirm.on('blur', onPasswordConfirmChanged);

			$('#changePasswordBtn').on('click', function() {

				if (passwordvalid && passwordsmatch && currentPassword.val()) {
					socket.emit('api:user.changePassword', {
						'currentPassword': currentPassword.val(),
						'newPassword': password.val()
					}, function(err) {

						currentPassword.val('');
						password.val('');
						password_confirm.val('');
						password_notify.addClass('hide');
						password_confirm_notify.addClass('hide');
						passwordsmatch = false;
						passwordvalid = false;

						if (err) {
							app.alertError(err.error);
							return;
						}

						app.alertSuccess('Your password is updated!');

					});
				}
				return false;
			});

		}());
	};

	AccountEdit.hideAlerts = function() {
		$('#alert-status').addClass('hide');
		$('#alert-success').addClass('hide');
		$('#alert-error').addClass('hide');
		$('#upload-progress-box').addClass('hide');
	}

	AccountEdit.status = function(message) {
		AccountEdit.hideAlerts();
		$('#alert-status').text(message).removeClass('hide');
	}

	AccountEdit.success = function(message) {
		AccountEdit.hideAlerts();
		$('#alert-success').text(message).removeClass('hide');
	}

	AccountEdit.error = function(message) {
		AccountEdit.hideAlerts();
		$('#alert-error').text(message).removeClass('hide');
	}

	AccountEdit.changeUserPicture = function(type) {
		var userData = {
			type: type
		};

		socket.emit('api:user.changePicture', userData, function(success) {
			if (!success) {
				app.alertError('There was an error changing picture!');
			}
		});
	}

	AccountEdit.updateImages = function() {
		var currentPicture = $('#user-current-picture').attr('src');
		var gravatarPicture = templates.get('gravatarpicture');
		var uploadedPicture = templates.get('uploadedpicture');

		if (gravatarPicture) {
			$('#user-gravatar-picture').attr('src', gravatarPicture);
			$('#gravatar-box').show();
		} else
			$('#gravatar-box').hide();

		if (uploadedPicture) {
			$('#user-uploaded-picture').attr('src', uploadedPicture);
			$('#uploaded-box').show();
		} else
			$('#uploaded-box').hide();


		if (currentPicture == gravatarPicture)
			$('#gravatar-box .icon-ok').show();
		else
			$('#gravatar-box .icon-ok').hide();

		if (currentPicture == uploadedPicture)
			$('#uploaded-box .icon-ok').show();
		else
			$('#uploaded-box .icon-ok').hide();
	}

	return AccountEdit;
});