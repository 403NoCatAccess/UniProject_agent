const common = {
	baseUrl: "http://127.0.0.1:8086",
	header: {
		'Content-Type': 'application/json;charset=UTF-8'
	},
	data: {},
	method: 'GET',
	dataType: 'json',
	timeout : 60000
};

function doRequest(options = {}) {
	// 组织参数
	options.url = common.baseUrl + options.url;
	options.header = options.header || common.header;
	options.data = options.data || common.data;
	options.method = options.method || common.method;
	options.dataType = options.dataType || common.dataType;
	options.timeout = options.timeout || common.timeout;
	return new Promise((resolve, reject) => {
		uni.request({
			...options,
			success: (result) => {
				let {
					statusCode,
					data
				} = result;
				// 返回原始数据
				if (options.native) return res(result);


				// 服务端失败
				if (statusCode !== 200) {
					if (options.toast !== false) {
						uni.showToast({
							title: data.msg || '服务端失败',
							icon: 'none'
						});
					}
					return reject(data)
				}

				// 成功
				resolve(data)
			},
			fail: ({
				errMsg
			}) => {
				uni.showToast({
					title: errMsg || '请求失败',
					icon: 'none'
				});
				return reject()
			},
			complete: () => {
				uni.hideLoading()
			}
		});
	})
}

const request = {
	post: (url, data = {}, options = {}) => {
		options.url = url;
		options.data = data;
		options.method = 'POST';
		return doRequest(options)
	},
	get: (url, data = {}, options = {}) => {
		options.url = url;
		options.data = data;
		options.method = 'GET';
		return doRequest(options)
	},
	put: (url, data = {}, options = {}) => {
		options.url = url;
		options.data = data;
		options.method = 'PUT';
		return doRequest(options)
	},
	delete: (url, data = {}, options = {}) => {
		options.url = url;
		options.data = data;
		options.method = 'DELETE';
		return doRequest(options)
	}
}

export default request