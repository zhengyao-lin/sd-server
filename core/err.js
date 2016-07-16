var tmp_count = 1

function errmsg(msg) {
	return {
		code: tmp_count++,
		msg: msg
	};
}

exports.code = {
	user_exists:					errmsg("user exists"),
	failed_connect_db:				errmsg("failed to connect database"),
	failed_get_col:					errmsg("failed to obtain collection"),
	wrong_arg:						errmsg("illegal or incomplete argument list"),
	internal_error:					errmsg("internal error"),
	user_exists_or_internal: 		errmsg("user exists or internal error"),
	login_failed:					errmsg("failed to log in"),
	invalid_session:				errmsg("invalid session id"),
	unable_finish_trans:			errmsg("unable to finish transaction(has been reverted)"),
	payee_not_exists:				errmsg("payee not exists"),
	not_enough_balance:				errmsg("balance is not enough"),
	illegal_trans_amount:			errmsg("illegal transaction amount"),
	no_auth:						errmsg("you have no authority to complete the action"),
	illegal_level:					errmsg("illegal level"),
	session_timeout:				errmsg("session timeout"),
	self_transfer:					errmsg("cannot transfer to yourself"),
	book_not_pub:					errmsg("the book is not on sale or it has been bought in a blink :("),
	book_not_exist:					errmsg("the book is not exist"),
	multi_ownership:				errmsg(
		"looks like the book is owned by not only one person, which is wierd. please contact the administrator if you are seeing this."
	),
	book_not_priv:					errmsg("this book is not your private book"),
	server_busy:					errmsg("server busy. please try a few sec later")
};

exports.debug = true;
exports.session_timeout = 6000000; // 6000 sec

/*
	pop message and write error to response
 */
exports.poperr = function (env, name) {
	msg = exports.code[name];
	env.err(
		"request from " + env.remote() + ": " +
		msg.msg + "(error code: " + msg.code + ")"
	);
	env.sendError(msg);
	return;
}

/*
	pop message only
 */
exports.popmsg = function (env, name) {
	msg = exports.code[name];
	env.err(
		"request from " + env.remote() + ": " +
		msg.msg + "(error code: " + msg.code + ")"
	);
	return;
}

exports.ensure = function (env, f, err_handler) {
	try {
		return f();
	} catch (e) {
		env.err(e);

		if (err_handler) {
			err_handler(function () {
				env.sendError(exports.code["internal_error"]);
			});
		} else {
			env.sendError(exports.code["internal_error"]);
		}
	}

	return;
}

/*
	1 of the argument in arg1 and arg2 is function and another is string
 */
exports.callback = function (env, arg1 /* opt */, arg2 /* opt */, arg3 /* opt */) {
	var err_name = undefined;
	var proc = undefined;
	var err_handler = undefined;

	if (typeof arg1 == "string") {
		err_name = arg1;
		proc = arg2;
		err_handler = arg3;
	} else if (typeof arg1 == "function") {
		proc = arg1;
		err_handler = arg2;
	}

	return function (e, dat) {
		if (e) {
			env.err(e);
			if (err_handler) {
				exports.popmsg(env, err_name || "internal_error");
				err_handler();
			} else if (env) {
				exports.poperr(env, err_name || "internal_error");
			}

			return;
		}

		if (proc) {
			return exports.ensure(env, function () {
				return proc(dat);
			}, err_handler);
		}

		return;
	};
}