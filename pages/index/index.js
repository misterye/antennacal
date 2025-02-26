// index.js
const satelliteData = {
  "Apstar-5C（Telstar 18 Vantage）": "138.0E",
  "EutelSat-172B": "172.0E",
  "Apstar-6D-Beam8": "134.5E",
  "Apstar-6D-Beam2": "134.1E",
  "Apstar-6C": "134.0E",
  "Apstar-9": "142.0E",
  "Apstar-7": "76.5E",
  "AsiaSat-9": "122.0E",
  "AsiaSat-7": "105.5E",
  "ChinaSat-16（圆极化）": "110.5E",
  "ChinaSat-26（圆极化）": "125.0E"
};

Page({
  data: {
      satelliteNames: Object.keys(satelliteData), // 用于 picker 组件的卫星名称列表
      satelliteIndex: 0, // 默认选中第一个卫星
      selectedSatelliteName: Object.keys(satelliteData)[0], // 默认选中的卫星名称
      latitude: '',
      longitude: '',
      orbitalLongitude: '',
      elevation: '',
      azimuth: '',
      polarization: '',
      markers: [] // 用于存储地图标记点信息
  },
  onLoad: function (options) {
      // 页面加载时执行，可以做一些初始化操作
  },
  bindSatelliteChange: function(e) {
      const satelliteIndex = e.detail.value;
      const satelliteName = this.data.satelliteNames[satelliteIndex]; // 获取选中的卫星名称
      this.setData({
          satelliteIndex: satelliteIndex, // 更新选中的卫星索引
          selectedSatelliteName: satelliteName // 更新选中的卫星名称
      });
  },
  bindLatitudeInput: function(e) {
      this.setData({
          latitude: e.detail.value // 更新纬度输入值
      });
  },
  bindLongitudeInput: function(e) {
      this.setData({
          longitude: e.detail.value // 更新经度输入值
      });
  },
  getLocation: function() {
      const that = this; // 保存 this 上下文
      wx.getLocation({
          success (res) {
              that.setData({
                  latitude: res.latitude.toFixed(2), // 更新纬度
                  longitude: res.longitude.toFixed(2) // 更新经度
              });
              wx.showToast({
                  title: '位置获取成功！',
                  icon: 'success',
                  duration: 1500
              })
          },
          fail (err) {
              console.error("getLocation 失败:", err); // 打印详细错误信息到控制台
              wx.showToast({
                  title: '获取位置失败，请手动输入',
                  icon: 'none',
                  duration: 2000
              })
          }
      })
  },
  calculate: function() {
      const selectedSatellite = this.data.selectedSatelliteName;
      const earthStationLatitude = parseFloat(this.data.latitude);
      const earthStationLongitude = parseFloat(this.data.longitude);

      const orbitalLongitudeString = satelliteData[selectedSatellite];

      if (isNaN(earthStationLatitude) || isNaN(earthStationLongitude) || !orbitalLongitudeString) {
          wx.showToast({
              title: '请输入有效的经纬度并选择卫星',
              icon: 'none',
              duration: 2000
          });
          return;
      }

      const orbitalLongitudeDirection = orbitalLongitudeString.slice(-1); // 'E' or 'W'
      let orbitalLongitudeValue = parseFloat(orbitalLongitudeString.slice(0, -1));
      if (orbitalLongitudeDirection === 'W') {
          orbitalLongitudeValue = -orbitalLongitudeValue; // 西经为负值
      }

      // 将经纬度转换为弧度
      const phi_e = earthStationLatitude * Math.PI / 180;
      const lambda_e = earthStationLongitude * Math.PI / 180;
      const lambda_s = orbitalLongitudeValue * Math.PI / 180;

      // 地球半径 (km)
      const R = 6371;
      // 地球静止轨道高度 (km)
      const H = 35786;

      // 计算地心角 cos(Δθ)
      const cos_delta_theta = Math.cos(phi_e) * Math.cos(lambda_s - lambda_e);

      // 计算俯仰角 (弧度)
      let elevation_rad = Math.atan((cos_delta_theta - R / (R + H)) / Math.sqrt(1 - cos_delta_theta * cos_delta_theta));
      if (isNaN(elevation_rad)) { // 处理分母为零的情况，即地球站正好在卫星正下方
          elevation_rad = Math.PI / 2; // 90度
      }
      const elevation_deg = elevation_rad * 180 / Math.PI;

      // 计算方位角 (弧度)
      let azimuth_rad = Math.atan2(Math.sin(lambda_s - lambda_e), Math.cos(phi_e) * Math.tan(0) - Math.sin(phi_e) * Math.cos(lambda_s - lambda_e));
      if (isNaN(azimuth_rad)) {
          azimuth_rad = 0;
      }
      let azimuth_deg = azimuth_rad * 180 / Math.PI;
      if (azimuth_deg < 0) {
          azimuth_deg += 360; // 确保方位角在 0-360 度范围内
      }

      // 计算极化角 (弧度)
      let polarization_rad = Math.atan(Math.sin(lambda_s - lambda_e) / Math.tan(phi_e));
      if (isNaN(polarization_rad)) {
          polarization_rad = 0;
      }
      const polarization_deg = polarization_rad * 180 / Math.PI;


      // 输出结果，保留两位小数
      this.setData({
          orbitalLongitude: orbitalLongitudeString,
          elevation: elevation_deg.toFixed(2) + '°',
          azimuth: azimuth_deg.toFixed(2) + '°',
          polarization: polarization_deg.toFixed(2) + '°',
          markers: [{ // 更新 markers 数据
            id: 0, // **新增 marker id，设置为数字 0**
            latitude: earthStationLatitude,   // 标记点的纬度
            longitude: earthStationLongitude,  // 标记点的经度
            iconPath: "/images/marker.png", // 标记点图标路径 (需要你准备一个 marker.png 图片)
            width: 34,      // 标记点图标宽度 (rpx)
            height: 34,     // 标记点图标高度 (rpx)
            rotate: azimuth_deg + 180, // **方位角基础上 + 180度，实现南向下的视觉效果**
            callout: {      // 气泡窗口
                content: '天线方位角: ' + azimuth_deg.toFixed(2) + '°', // 气泡内容
                fontSize: 14,
                color: '#ffffff',
                bgColor: '#007bff',
                padding: 10,
                borderRadius: 5,
                display: 'ALWAYS' // 始终显示气泡
            }
          }]
      });
  }
})