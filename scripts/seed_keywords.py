#!/usr/bin/env python3
"""
种子关键词生成器：基于已知的 9 大产品线 + 4 大商业意图 + 4 类裂变公式
生成首批 ~2000 关键词，让生成器先跑通。
OCR 完成后会被真实数据覆盖。

数据来源：报告里已读到的 ~180 个原始词 + 规则化扩展
"""
import json
import re
from pathlib import Path
from collections import OrderedDict

OUT = Path(r"C:\Users\Administrator\.mavis\workspace\box-beeaa-site\data\keywords.json")

# 9 大产品线的核心词池（从报告里已知 200+ 个原始词）
PRODUCT_LINE_KEYWORDS = {
    "military-tactical-case": {
        "name_zh": "军工战术防护系列",
        "name_en": "Military & Tactical Case",
        "slug": "military-tactical-case",
        "original": [
            ("军工箱", "Military Grade Case"),
            ("军规防护箱", "Military Grade Case"),
            ("战术转运箱", "Military Grade Case"),
            ("特警装备箱", "Military Grade Case"),
            ("军用物资运输箱", "Military Grade Case"),
            ("单兵装备携行箱", "Military Grade Case"),
            ("军用箱子", "Tactical Military Box"),
            ("军队制式箱", "Tactical Military Box"),
            ("军品密封箱", "Tactical Military Box"),
            ("野战防爆箱", "Tactical Military Box"),
            ("军绿硬壳安全箱", "Tactical Military Box"),
            ("迷彩特种箱", "Tactical Military Box"),
            ("枪械箱", "Rifle Case / Gun Case"),
            ("战术枪箱", "Rifle Case / Gun Case"),
            ("硬壳枪盒", "Rifle Case / Gun Case"),
            ("射击运动行李箱", "Rifle Case / Gun Case"),
            ("长枪箱", "Rifle Case / Gun Case"),
            ("双枪步枪箱", "Rifle Case / Gun Case"),
            ("狙击枪专用箱", "Rifle Case / Gun Case"),
            ("子弹箱", "Ammo Can / Ammo Box"),
            ("弹药箱", "Ammo Can / Ammo Box"),
            ("铁皮子弹盒", "Ammo Can / Ammo Box"),
            ("塑料弹药周转箱", "Ammo Can / Ammo Box"),
            ("军绿色子弹箱", "Ammo Can / Ammo Box"),
            ("防水防潮弹药盒", "Ammo Can / Ammo Box"),
            ("手枪保护盒", "Pistol Case / Handgun Case"),
            ("短枪盒", "Pistol Case / Handgun Case"),
            ("手枪密码箱", "Pistol Case / Handgun Case"),
            ("便携战术手枪包", "Pistol Case / Handgun Case"),
            ("模块化海绵手枪盒", "Pistol Case / Handgun Case"),
            ("双层手枪防护箱", "Pistol Case / Handgun Case"),
            ("雷管运输箱", "Detonator Transport Box"),
            ("炸药雷管箱", "Detonator Transport Box"),
            ("危险品防爆箱", "Detonator Transport Box"),
            ("民爆物资箱", "Detonator Transport Box"),
            ("防静电雷管盒", "Detonator Transport Box"),
            ("火工品专用防护箱", "Detonator Transport Box"),
            ("瞄准镜保护盒", "Rifle Scope Case"),
            ("光学瞄具盒", "Rifle Scope Case"),
            ("红外热成像瞄准镜箱", "Rifle Scope Case"),
            ("高精度狙击镜硬壳盒", "Rifle Scope Case"),
            ("战术配件盒", "Rifle Scope Case"),
            ("夜视仪防护箱", "Night Vision Goggles Case"),
            ("头盔夜视仪箱", "Night Vision Goggles Case"),
            ("微光夜视仪盒", "Night Vision Goggles Case"),
            ("军用电光仪器箱", "Night Vision Goggles Case"),
            ("防震夜视仪安全箱", "Night Vision Goggles Case"),
            ("战术医疗箱", "Tactical Medical Kit Case"),
            ("战场急救箱", "Tactical Medical Kit Case"),
            ("军医背负箱", "Tactical Medical Kit Case"),
            ("野外搜救药箱", "Tactical Medical Kit Case"),
            ("橙色救援箱", "Tactical Medical Kit Case"),
            ("特种兵医药箱", "Tactical Medical Kit Case"),
            ("信号屏蔽军工箱", "RF Shielding Box"),
            ("无线隔离箱", "RF Shielding Box"),
            ("防窃听气密箱", "RF Shielding Box"),
            ("EMC 测试箱", "RF Shielding Box"),
            ("军用通信隔离箱", "RF Shielding Box"),
            ("特种信号防护箱", "RF Shielding Box"),
            ("抛投式空投箱", "Airdrop Protective Case"),
            ("伞兵物资箱", "Airdrop Protective Case"),
            ("高空抗坠落箱", "Airdrop Protective Case"),
            ("空投转运箱", "Airdrop Protective Case"),
            ("重型滚塑空投箱", "Airdrop Protective Case"),
            ("抗冲击坠落安全箱", "Airdrop Protective Case"),
            ("军用车载工具箱", "Vehicle Military Tool Box"),
            ("战车随车修理箱", "Vehicle Military Tool Box"),
            ("装甲车五金箱", "Vehicle Military Tool Box"),
            ("重型搭扣铁锁工具箱", "Vehicle Military Tool Box"),
            ("抗震随车箱", "Vehicle Military Tool Box"),
            ("战术手电收纳盒", "Tactical Flashlight Case"),
            ("强光手电盒", "Tactical Flashlight Case"),
            ("单兵战术配件盒", "Tactical Flashlight Case"),
            ("多格塑料小配件盒", "Tactical Flashlight Case"),
            ("防水手电硬壳盒", "Tactical Flashlight Case"),
            ("弹夹周转箱", "Magazine Storage Case"),
            ("步枪弹匣盒", "Magazine Storage Case"),
            ("战术胸挂配件箱", "Magazine Storage Case"),
            ("压弹器收纳盒", "Magazine Storage Case"),
            ("大容量弹夹防爆箱", "Magazine Storage Case"),
            ("军标测试仪器箱", "MIL-SPEC Equipment Case"),
            ("军规安全箱", "MIL-SPEC Equipment Case"),
            ("美军标认证箱", "MIL-SPEC Equipment Case"),
            ("盐雾防腐军标箱", "MIL-SPEC Equipment Case"),
            ("高低温交变测试箱", "MIL-SPEC Equipment Case"),
            ("机要文件保密箱", "Secure Document Case"),
            ("密码公文箱", "Secure Document Case"),
            ("防焚文件盒", "Secure Document Case"),
            ("双人双锁箱", "Secure Document Case"),
            ("银行押运解款箱", "Secure Document Case"),
            ("政府机密档案箱", "Secure Document Case"),
            ("防弹物资储运箱", "Bullet-resistant Box"),
            ("特种装甲防爆箱", "Bullet-resistant Box"),
            ("高危押运物资箱", "Bullet-resistant Box"),
            ("复合碳纤维防护箱", "Bullet-resistant Box"),
            ("防爆破安全箱", "Bullet-resistant Box"),
            ("演习后勤保障箱", "Military Logistics Box"),
            ("演练周转箱", "Military Logistics Box"),
            ("军营仓储箱", "Military Logistics Box"),
            ("重型围板箱", "Military Logistics Box"),
            ("大容量折叠仓储箱", "Military Logistics Box"),
            ("野战营地收纳箱", "Military Logistics Box"),
            ("野战指挥工作站", "Field Command Post Case"),
            ("便携式一体化指挥箱", "Field Command Post Case"),
            ("拉杆野外办公箱", "Field Command Post Case"),
            ("带折叠桌椅战术箱", "Field Command Post Case"),
            ("野战电台箱", "Field Command Post Case"),
            ("腐蚀海军舰载箱", "Marine Grade Tactical Case"),
            ("船载防盐雾箱", "Marine Grade Tactical Case"),
            ("潜水特种装备箱", "Marine Grade Tactical Case"),
            ("高气密性硅胶圈密封箱", "Marine Grade Tactical Case"),
            ("海防仪器箱", "Marine Grade Tactical Case"),
        ],
        "sub_categories": {
            "rifle-case": ["枪械箱", "长枪箱", "狙击枪箱", "短枪盒", "手枪保护盒"],
            "ammo-case": ["子弹箱", "弹药箱", "弹药盒", "防潮弹药盒"],
            "tactical-medical-case": ["战术医疗箱", "战场急救箱", "野外搜救药箱"],
            "rf-shielding-case": ["信号屏蔽军工箱", "无线隔离箱", "EMC 测试箱"],
            "airdrop-case": ["空投箱", "伞兵物资箱", "高空抗坠落箱"],
            "vehicle-tool-box": ["军用车载工具箱", "战车随车修理箱", "装甲车五金箱"],
            "magazine-case": ["弹夹周转箱", "弹匣盒", "弹夹收纳盒"],
            "mil-spec-case": ["军标测试仪器箱", "美军标认证箱"],
            "secure-document-case": ["机要文件保密箱", "密码公文箱", "政府机密档案箱"],
            "bullet-resistant-case": ["防弹物资储运箱", "防爆押运物资箱", "防爆破安全箱"],
            "logistics-case": ["演习后勤保障箱", "军营仓储箱", "野战营地收纳箱"],
            "field-command-case": ["野战指挥工作站", "拉杆野外办公箱", "野战电台箱"],
            "marine-grade-case": ["海军舰载箱", "防盐雾箱", "海防仪器箱"],
        },
    },
    "drone-case": {
        "name_zh": "无人机与机器人系列",
        "name_en": "Drone & Robotics Case",
        "slug": "drone-case",
        "original": [
            ("无人机箱", "Drone Case / UAV Case"),
            ("航拍器防护箱", "Drone Case / UAV Case"),
            ("飞行器硬壳箱", "Drone Case / UAV Case"),
            ("大疆专业箱", "Drone Case / UAV Case"),
            ("植保无人机箱", "Drone Case / UAV Case"),
            ("测绘无人机拉杆箱", "Drone Case / UAV Case"),
            ("水下无人机箱", "Underwater ROV Case"),
            ("水下机器人箱", "Underwater ROV Case"),
            ("潜航器防护箱", "Underwater ROV Case"),
            ("水下相机箱", "Underwater ROV Case"),
            ("潜水探照灯配件箱", "Underwater ROV Case"),
            ("水下测绘设备箱", "Underwater ROV Case"),
            ("无人机电池防爆箱", "UAV Battery Safety Case"),
            ("锂电池充电箱", "UAV Battery Safety Case"),
            ("防燃电池盒", "UAV Battery Safety Case"),
            ("智能电池箱", "UAV Battery Safety Case"),
            ("穿越机电池收纳盒", "UAV Battery Safety Case"),
            ("外场多路充电箱", "UAV Battery Safety Case"),
            ("遥控器硬壳包", "RC Transmitter Hard Case"),
            ("遥控器保护盒", "RC Transmitter Hard Case"),
            ("手柄收纳包", "RC Transmitter Hard Case"),
            ("带屏遥控器箱", "RC Transmitter Hard Case"),
            ("通用型航模遥控器硬盒", "RC Transmitter Hard Case"),
            ("定制EVA 手柄盒", "RC Transmitter Hard Case"),
            ("固定翼航模运输箱", "RC Airplane Transport Case"),
            ("航模大容量周转箱", "RC Airplane Transport Case"),
            ("车模硬壳箱", "RC Airplane Transport Case"),
            ("模型拉杆箱", "RC Airplane Transport Case"),
            ("复合板大号航空箱", "RC Airplane Transport Case"),
            ("固定翼拆解防护箱", "RC Airplane Transport Case"),
            ("无人机全套一体箱", "All-in-one Drone Hard Case"),
            ("穿越机畅飞套装箱", "All-in-one Drone Hard Case"),
            ("全能套装硬壳箱", "All-in-one Drone Hard Case"),
            ("双层大容量无人机箱", "All-in-one Drone Hard Case"),
            ("御系列御3防护箱", "All-in-one Drone Hard Case"),
            ("测绘无人机RTK箱", "UAV RTK Ground Station Case"),
            ("无人机地基站箱", "UAV RTK Ground Station Case"),
            ("移动基站防护箱", "UAV RTK Ground Station Case"),
            ("测绘箱", "UAV RTK Ground Station Case"),
            ("激光雷达一体箱", "UAV RTK Ground Station Case"),
            ("高精度分体海绵箱", "UAV RTK Ground Station Case"),
            ("穿越机背包硬壳", "FPV Drone Hard Backpack"),
            ("FPV 眼镜包", "FPV Drone Hard Backpack"),
            ("穿越机硬壳双肩包", "FPV Drone Hard Backpack"),
            ("防撞穿越机收纳箱", "FPV Drone Hard Backpack"),
            ("外挂式战术飞行包", "FPV Drone Hard Backpack"),
            ("机器人电机包装箱", "Robotic Motor Protective Case"),
            ("伺服电机包装盒", "Robotic Motor Protective Case"),
            ("自动化关节防震箱", "Robotic Motor Protective Case"),
            ("精密丝杠保护盒", "Robotic Motor Protective Case"),
            ("工业机器人配件箱", "Robotic Motor Protective Case"),
            ("遥控车模避震箱", "RC Car Hard Travel Case"),
            ("大脚车转运箱", "RC Car Hard Travel Case"),
            ("攀爬车硬壳箱", "RC Car Hard Travel Case"),
            ("车模工具箱", "RC Car Hard Travel Case"),
            ("吹塑车模包装盒", "RC Car Hard Travel Case"),
            ("防油污配件周转箱", "RC Car Hard Travel Case"),
        ],
        "sub_categories": {
            "uav-hard-case": ["无人机箱", "航拍器防护箱", "大疆专业箱", "植保无人机箱"],
            "underwater-rov-case": ["水下无人机箱", "水下机器人箱", "潜航器防护箱"],
            "uav-battery-case": ["无人机电池防爆箱", "锂电池充电箱", "智能电池箱"],
            "rc-transmitter-case": ["遥控器硬壳包", "遥控器保护盒", "带屏遥控器箱"],
            "rc-airplane-case": ["固定翼航模运输箱", "航模周转箱", "模型拉杆箱"],
            "all-in-one-drone-case": ["无人机全套一体箱", "穿越机畅飞套装箱", "双层大容量无人机箱"],
            "uav-rtk-case": ["测绘无人机RTK箱", "无人机地基站箱", "激光雷达一体箱"],
            "fpv-drone-backpack": ["穿越机背包硬壳", "FPV 眼镜包", "穿越机硬壳双肩包"],
            "robotic-motor-case": ["机器人电机包装箱", "伺服电机包装盒", "自动化关节防震箱"],
            "rc-car-case": ["遥控车模避震箱", "大脚车转运箱", "车模工具箱"],
        },
    },
    "instrument-case": {
        "name_zh": "精密仪器仪表系列",
        "name_en": "Precision Instrument Case",
        "slug": "instrument-case",
        "original": [
            ("仪器箱", "Instrument Case"),
            ("仪表箱", "Instrument Case"),
            ("精密设备箱", "Instrument Case"),
            ("电子测试箱", "Instrument Case"),
            ("示波器硬壳箱", "Instrument Case"),
            ("光谱分析仪防护箱", "Instrument Case"),
            ("测绘仪器箱", "Surveying Instrument Case"),
            ("经纬仪箱", "Surveying Instrument Case"),
            ("全站仪防护箱", "Surveying Instrument Case"),
            ("水准仪塑料盒", "Surveying Instrument Case"),
            ("三维激光扫描仪箱", "Surveying Instrument Case"),
            ("GPS手簿保护盒", "Surveying Instrument Case"),
            ("环保检测仪器箱", "Environmental Tester Case"),
            ("气体检测仪箱", "Environmental Tester Case"),
            ("水质分析仪箱", "Environmental Tester Case"),
            ("采样设备箱", "Environmental Tester Case"),
            ("环评多参数测试仪箱", "Environmental Tester Case"),
            ("空气采样罐箱", "Environmental Tester Case"),
            ("探伤仪防护箱", "Flaw Detector Case"),
            ("超声波探伤仪箱", "Flaw Detector Case"),
            ("无损检测设备箱", "Flaw Detector Case"),
            ("射线箱", "Flaw Detector Case"),
            ("钢结构检测仪便携箱", "Flaw Detector Case"),
            ("工业测厚仪盒", "Flaw Detector Case"),
            ("光纤熔接机箱", "Fusion Splicer Case"),
            ("光缆施工工具箱", "Fusion Splicer Case"),
            ("通信工程箱", "Fusion Splicer Case"),
            ("红流仪箱", "Fusion Splicer Case"),
            ("光纤测试仪硬壳箱", "Fusion Splicer Case"),
            ("网络排障手提箱", "Fusion Splicer Case"),
            ("气象仪器携带箱", "Meteorological Box"),
            ("天气监测设备箱", "Meteorological Box"),
            ("风速仪防护箱", "Meteorological Box"),
            ("雨量计箱", "Meteorological Box"),
            ("野外气象站便携箱", "Meteorological Box"),
            ("传感器收纳硬箱", "Meteorological Box"),
            ("热成像仪保护盒", "Thermal Imager Case"),
            ("红外热像仪箱", "Thermal Imager Case"),
            ("夜视热成像盒", "Thermal Imager Case"),
            ("测温仪盒", "Thermal Imager Case"),
            ("手持式热分析仪箱", "Thermal Imager Case"),
            ("消防热成像防护盒", "Thermal Imager Case"),
            ("地质勘探采样箱", "Geological Sampling Box"),
            ("矿石采样箱", "Geological Sampling Box"),
            ("岩心收纳保护箱", "Geological Sampling Box"),
            ("化石盒", "Geological Sampling Box"),
            ("野外勘探地质锤箱", "Geological Sampling Box"),
            ("土壤采样器材箱", "Geological Sampling Box"),
            ("内窥镜防护箱", "Endoscope Storage Case"),
            ("工业内窥镜箱", "Endoscope Storage Case"),
            ("管道检测仪便携箱", "Endoscope Storage Case"),
            ("胃镜箱", "Endoscope Storage Case"),
            ("蛇形管探头收纳箱", "Endoscope Storage Case"),
            ("高清监视器一体箱", "Endoscope Storage Case"),
            ("激光测距仪盒", "Laser Rangefinder Case"),
            ("测距仪保护套", "Laser Rangefinder Case"),
            ("手持测量仪盒", "Laser Rangefinder Case"),
            ("雷达防护盒", "Laser Rangefinder Case"),
            ("激光雷达硬壳保护盒", "Laser Rangefinder Case"),
            ("高尔夫测距仪包", "Laser Rangefinder Case"),
            ("数据采集模块箱", "Data Acquisition Case"),
            ("信号采集箱", "Data Acquisition Case"),
            ("物联网网关箱", "Data Acquisition Case"),
            ("工控机外壳", "Data Acquisition Case"),
            ("边缘计算设备箱", "Data Acquisition Case"),
            ("现场数据记录仪箱", "Data Acquisition Case"),
            ("防静电芯片盒", "Anti-static ESD Box"),
            ("晶圆导电盒", "Anti-static ESD Box"),
            ("电子元件防静电箱", "Anti-static ESD Box"),
            ("IC 小料盒", "Anti-static ESD Box"),
            ("导电 PP 注塑盒", "Anti-static ESD Box"),
            ("无尘室防静电周转箱", "Anti-static ESD Box"),
            ("精密量具量规盒", "Precision Gauge Block Box"),
            ("游标卡尺盒", "Precision Gauge Block Box"),
            ("千分尺塑料盒", "Precision Gauge Block Box"),
            ("塞规环规盒", "Precision Gauge Block Box"),
            ("针规高防锈保护盒", "Precision Gauge Block Box"),
            ("百分表防震硬盒", "Precision Gauge Block Box"),
            ("传感器信号采集箱", "Sensor Interface Box"),
            ("工业传感器外壳", "Sensor Interface Box"),
            ("多路信号转换箱", "Sensor Interface Box"),
            ("铝制仪表壳体", "Sensor Interface Box"),
            ("阻燃 ABS 工控盒", "Sensor Interface Box"),
            ("手持打标机便携箱", "Portable Laser Marking Case"),
            ("激光打码机外壳", "Portable Laser Marking Case"),
            ("手持喷码机包装箱", "Portable Laser Marking Case"),
            ("工业级便携打标机防护箱", "Portable Laser Marking Case"),
        ],
        "sub_categories": {
            "instrument-case": ["仪器箱", "仪表箱", "示波器硬壳箱"],
            "surveying-case": ["测绘仪器箱", "经纬仪箱", "全站仪防护箱"],
            "environmental-tester-case": ["环保检测仪器箱", "气体检测仪箱", "水质分析仪箱"],
            "flaw-detector-case": ["探伤仪防护箱", "超声波探伤仪箱", "射线箱"],
            "fusion-splicer-case": ["光纤熔接机箱", "光纤测试仪硬壳箱", "网络排障手提箱"],
            "meteorological-case": ["气象仪器携带箱", "风速仪防护箱", "野外气象站便携箱"],
            "thermal-imager-case": ["热成像仪保护盒", "红外热像仪箱", "消防热成像防护盒"],
            "geological-case": ["地质勘探采样箱", "矿石采样箱", "土壤采样器材箱"],
            "endoscope-case": ["内窥镜防护箱", "工业内窥镜箱", "管道检测仪便携箱"],
            "rangefinder-case": ["激光测距仪盒", "手持测量仪盒", "激光雷达硬壳保护盒"],
            "data-acquisition-case": ["数据采集模块箱", "信号采集箱", "物联网网关箱"],
            "anti-static-case": ["防静电芯片盒", "晶圆导电盒", "无尘室防静电周转箱"],
            "gauge-case": ["精密量具量规盒", "游标卡尺盒", "千分尺塑料盒"],
            "sensor-case": ["传感器信号采集箱", "工业传感器外壳", "阻燃 ABS 工控盒"],
            "laser-marking-case": ["手持打标机便携箱", "激光打码机外壳", "工业级便携打标机防护箱"],
        },
    },
    "waterproof-case": {
        "name_zh": "防水户外安全系列",
        "name_en": "Waterproof Outdoor Case",
        "slug": "waterproof-case",
        "original": [
            ("防水箱", "Waterproof Case"),
            ("全密封防水箱", "Waterproof Case"),
            ("IP67 防尘防水箱", "Waterproof Case"),
            ("防爆水箱", "Waterproof Case"),
            ("海上漂浮防水箱", "Waterproof Case"),
            ("潜水手提安全箱", "Waterproof Case"),
            ("户外箱", "Outdoor Dry Box"),
            ("户外露营收纳箱", "Outdoor Dry Box"),
            ("野外生存硬壳箱", "Outdoor Dry Box"),
            ("自驾箱", "Outdoor Dry Box"),
            ("越野车外挂箱", "Outdoor Dry Box"),
            ("后备箱多功能储物箱", "Outdoor Dry Box"),
            ("保护盒箱", "Small Protective Case"),
            ("迷你防护盒", "Small Protective Case"),
            ("便携硬壳胶盒", "Small Protective Case"),
            ("数码保护盒", "Small Protective Case"),
            ("钥匙防盗安全盒", "Small Protective Case"),
            ("户外随身防水盒", "Small Protective Case"),
            ("防潮箱", "Moisture-proof Dry Box"),
            ("相机防潮柜", "Moisture-proof Dry Box"),
            ("电子吸湿干燥箱", "Moisture-proof Dry Box"),
            ("气密防潮箱", "Moisture-proof Dry Box"),
            ("气密性防潮吸湿硬箱", "Moisture-proof Dry Box"),
            ("中药材防潮保护盒", "Moisture-proof Dry Box"),
            ("潜水装备防护箱", "Scuba Diving Gear Case"),
            ("潜水镜脚蹼收纳箱", "Scuba Diving Gear Case"),
            ("潜水电筒箱", "Scuba Diving Gear Case"),
            ("专业潜水大容量防水箱", "Scuba Diving Gear Case"),
            ("重型卡扣密封箱", "Scuba Diving Gear Case"),
            ("船用密封仪器箱", "Marine Sealed Instrument Case"),
            ("游艇防水工具箱", "Marine Sealed Instrument Case"),
            ("海工设备防盐雾箱", "Marine Sealed Instrument Case"),
            ("船舶救生设备收纳箱", "Marine Sealed Instrument Case"),
            ("海上急救密封箱", "Marine Sealed Instrument Case"),
            ("钓鱼配件防水盒", "Waterproof Fishing Tackle Box"),
            ("路亚饵盒", "Waterproof Fishing Tackle Box"),
            ("钓鱼线轮保护盒", "Waterproof Fishing Tackle Box"),
            ("鱼钩盒", "Waterproof Fishing Tackle Box"),
            ("多格防水钓鱼配件箱", "Waterproof Fishing Tackle Box"),
            ("台钓主线盒", "Waterproof Fishing Tackle Box"),
            ("户外电源保护箱", "Portable Power Station Case"),
            ("移动电源硬壳箱", "Portable Power Station Case"),
            ("储能电池防护箱", "Portable Power Station Case"),
            ("太阳能折叠板收纳箱", "Portable Power Station Case"),
            ("逆变器一体外壳", "Portable Power Station Case"),
            ("漂流防水手提箱", "Drifting Waterproof Case"),
            ("溯溪防水包", "Drifting Waterproof Case"),
            ("水上运动密封箱", "Drifting Waterproof Case"),
            ("冲浪盒", "Drifting Waterproof Case"),
            ("充气艇备用物资箱", "Drifting Waterproof Case"),
            ("防沙手机密封盒", "Drifting Waterproof Case"),
            ("探险物资密封箱", "Expedition Storage Box"),
            ("极地探险保温箱", "Expedition Storage Box"),
            ("无人区科考箱", "Expedition Storage Box"),
            ("防冻箱", "Expedition Storage Box"),
            ("恶劣气候全天候防护箱", "Expedition Storage Box"),
            ("-40 度耐寒箱", "Expedition Storage Box"),
            ("自驾车顶顶棚箱", "Car Roof Cargo Box"),
            ("车顶行李箱", "Car Roof Cargo Box"),
            ("车顶纵梁外挂箱", "Car Roof Cargo Box"),
            ("车尾工具箱", "Car Roof Cargo Box"),
            ("越野加装工具箱", "Car Roof Cargo Box"),
            ("皮卡后斗重型密封箱", "Car Roof Cargo Box"),
            ("带排气阀安全箱", "Auto Pressure Valve Case"),
            ("自动排气防水箱", "Auto Pressure Valve Case"),
            ("高原防吸附密封箱", "Auto Pressure Valve Case"),
            ("空运自动平衡气压箱", "Auto Pressure Valve Case"),
            ("防压抗凹陷箱", "Auto Pressure Valve Case"),
            ("防尘工业安全箱", "Dustproof Safety Case"),
            ("IP6X 防尘箱", "Dustproof Safety Case"),
            ("沙漠风沙防护箱", "Dustproof Safety Case"),
            ("矿山采掘设备防护箱", "Dustproof Safety Case"),
            ("水泥厂点检箱", "Dustproof Safety Case"),
            ("重型抗压防护箱", "Heavy-duty Protective Case"),
            ("耐磨抗摔防护箱", "Heavy-duty Protective Case"),
            ("工业级防压箱", "Heavy-duty Protective Case"),
            ("卡车用箱", "Heavy-duty Protective Case"),
            ("承重型工程塑料防护箱", "Heavy-duty Protective Case"),
            ("堆叠不顶翻箱", "Heavy-duty Protective Case"),
            ("防紫外线抗老化箱", "Anti-UV Plastic Case"),
            ("耐黄变户外箱", "Anti-UV Plastic Case"),
            ("抗紫外线塑料防护箱", "Anti-UV Plastic Case"),
            ("长期暴晒不脆化安全箱", "Anti-UV Plastic Case"),
            ("光伏控制箱", "Anti-UV Plastic Case"),
        ],
        "sub_categories": {
            "drifting-case": ["漂流防水手提箱", "溯溪防水包", "水上运动密封箱"],
            "expedition-case": ["探险物资密封箱", "极地探险保温箱", "无人区科考箱", "-40度耐寒箱"],
            "car-roof-cargo-box": ["自驾车顶顶棚箱", "车顶行李箱", "皮卡后斗重型密封箱"],
            "auto-pressure-valve-case": ["带排气阀安全箱", "自动排气防水箱", "高原防吸附密封箱"],
            "dustproof-safety-case": ["防尘工业安全箱", "IP6X 防尘箱", "水泥厂点检箱"],
            "heavy-duty-case": ["重型抗压防护箱", "耐磨抗摔防护箱", "工业级防压箱"],
            "anti-uv-case": ["防紫外线抗老化箱", "耐黄变户外箱", "抗紫外线塑料防护箱", "光伏控制箱"],
            "waterproof-case": ["防水箱", "全密封防水箱", "IP67 防尘防水箱"],
            "outdoor-dry-box": ["户外箱", "户外露营收纳箱", "野外生存硬壳箱"],
            "small-protective-case": ["保护盒箱", "迷你防护盒", "便携硬壳胶盒"],
            "moisture-proof-dry-box": ["防潮箱", "相机防潮柜", "气密防潮箱"],
            "scuba-diving-gear-case": ["潜水装备防护箱", "潜水镜脚蹼收纳箱", "重型卡扣密封箱"],
            "marine-sealed-instrument-case": ["船用密封仪器箱", "游艇防水工具箱", "海工设备防盐雾箱"],
            "waterproof-fishing-tackle-box": ["钓鱼配件防水盒", "路亚饵盒", "鱼钩盒"],
            "portable-power-station-case": ["户外电源保护箱", "移动电源硬壳箱", "储能电池防护箱"],
        },
    },
    "medical-case": {
        "name_zh": "医疗急救冷链系列",
        "name_en": "Medical & Cold Chain Case",
        "slug": "medical-case",
        "original": [
            ("医疗箱", "Medical First Aid Box"),
            ("医药箱", "Medical First Aid Box"),
            ("家庭急救箱", "Medical First Aid Box"),
            ("医生出诊箱", "Medical First Aid Box"),
            ("学校保健室医药箱", "Medical First Aid Box"),
            ("公司工厂应急药箱", "Medical First Aid Box"),
            ("医疗仪器箱", "Medical Instrument Case"),
            ("医疗设备箱", "Medical Instrument Case"),
            ("体检一体机箱", "Medical Instrument Case"),
            ("透析机箱", "Medical Instrument Case"),
            ("激光医疗设备外壳", "Medical Instrument Case"),
            ("便携式B超机防护箱", "Medical Instrument Case"),
            ("医疗试剂冷藏箱", "Medical Cold Chain Box"),
            ("血液运输保温箱", "Medical Cold Chain Box"),
            ("疫苗冷链箱", "Medical Cold Chain Box"),
            ("取样箱", "Medical Cold Chain Box"),
            ("实验室生物样品采样箱", "Medical Cold Chain Box"),
            ("干冰冷冻箱", "Medical Cold Chain Box"),
            ("医疗急救转运箱", "Medical Emergency Case"),
            ("120 随车急救箱", "Medical Emergency Case"),
            ("出诊医药箱", "Medical Emergency Case"),
            ("除颤仪箱", "Medical Emergency Case"),
            ("院前急救呼吸机箱", "Medical Emergency Case"),
            ("AED 自动除颤仪保护盒", "Medical Emergency Case"),
            ("基因检测设备箱", "Genetic Analyzer Case"),
            ("DNA 检测仪箱", "Genetic Analyzer Case"),
            ("实验室便携设备箱", "Genetic Analyzer Case"),
            ("核酸箱", "Genetic Analyzer Case"),
            ("移动核酸检测箱", "Genetic Analyzer Case"),
            ("病毒采样管转运箱", "Genetic Analyzer Case"),
            ("牙科器材携带箱", "Dental Equipment Case"),
            ("种植牙工具盒", "Dental Equipment Case"),
            ("正畸器材收纳箱", "Dental Equipment Case"),
            ("牙模盒", "Dental Equipment Case"),
            ("便携式牙科诊疗一体箱", "Dental Equipment Case"),
            ("根管治疗工具盒", "Dental Equipment Case"),
            ("听诊器医生随身包", "Stethoscope Protective Case"),
            ("医生诊断包", "Stethoscope Protective Case"),
            ("血压计便携保护盒", "Stethoscope Protective Case"),
            ("药剂盒", "Stethoscope Protective Case"),
            ("电子血压计盒", "Stethoscope Protective Case"),
            ("家用医疗收纳盒", "Stethoscope Protective Case"),
            ("生物安全转运箱", "Biological Specimen Carrier"),
            ("UN3373 标准高危样本箱", "Biological Specimen Carrier"),
            ("高传染性标本箱", "Biological Specimen Carrier"),
            ("临床试验标本干冰箱", "Biological Specimen Carrier"),
            ("防泄漏三层包装箱", "Biological Specimen Carrier"),
            ("腹透液恒温拉杆箱", "Peritoneal Dialysis Warmer Box"),
            ("腹透液恒温加热箱", "Peritoneal Dialysis Warmer Box"),
            ("医疗拉杆恒温箱", "Peritoneal Dialysis Warmer Box"),
            ("尿毒症患者出行保障箱", "Peritoneal Dialysis Warmer Box"),
            ("车载恒温箱", "Peritoneal Dialysis Warmer Box"),
            ("手术医疗五金工具箱", "Surgical Instrument Case"),
            ("手术刀具消毒箱", "Surgical Instrument Case"),
            ("骨科内固定器械盒", "Surgical Instrument Case"),
            ("铝合金高压灭菌盒", "Surgical Instrument Case"),
            ("不锈钢打孔清洗盒", "Surgical Instrument Case"),
        ],
        "sub_categories": {
            "first-aid-box": ["医疗箱", "医药箱", "家庭急救箱"],
            "medical-instrument-case": ["医疗仪器箱", "体检一体机箱", "透析机箱"],
            "medical-cold-chain-box": ["医疗试剂冷藏箱", "血液运输保温箱", "疫苗冷链箱"],
            "medical-emergency-case": ["医疗急救转运箱", "120 随车急救箱", "除颤仪箱", "AED 自动除颤仪保护盒"],
            "genetic-analyzer-case": ["基因检测设备箱", "DNA 检测仪箱", "移动核酸检测箱", "核酸箱"],
            "dental-equipment-case": ["牙科器材携带箱", "种植牙工具盒", "正畸器材收纳箱"],
            "stethoscope-case": ["听诊器医生随身包", "医生诊断包", "血压计便携保护盒"],
            "biological-specimen-carrier": ["生物安全转运箱", "UN3373 标准高危样本箱", "高传染性标本箱", "防泄漏三层包装箱"],
            "peritoneal-dialysis-warmer": ["腹透液恒温拉杆箱", "腹透液恒温加热箱", "车载恒温箱"],
            "surgical-instrument-case": ["手术医疗五金工具箱", "骨科内固定器械盒", "铝合金高压灭菌盒"],
        },
    },
    "engineering-plastic-case": {
        "name_zh": "工程塑料工艺系列",
        "name_en": "Engineering Plastic Case",
        "slug": "engineering-plastic-case",
        "original": [
            ("PP 箱", "PP Case / Polypropylene Box"),
            ("聚丙烯改性塑料箱", "PP Case / Polypropylene Box"),
            ("PP 工程塑料防护箱", "PP Case / Polypropylene Box"),
            ("高韧性 PP 注塑箱", "PP Case / Polypropylene Box"),
            ("玻纤增强 PP 注塑箱", "PP Case / Polypropylene Box"),
            ("ABS 箱", "ABS Case / Acrylonitrile Box"),
            ("ABS 树脂硬壳箱", "ABS Case / Acrylonitrile Box"),
            ("ABS 注塑工具箱", "ABS Case / Acrylonitrile Box"),
            ("机箱", "ABS Case / Acrylonitrile Box"),
        ],
        "sub_categories": {
            "pp-case": ["PP 箱", "聚丙烯改性塑料箱", "PP 工程塑料防护箱", "高韧性 PP 注塑箱", "玻纤增强 PP 注塑箱"],
            "abs-case": ["ABS 箱", "ABS 树脂硬壳箱", "ABS 注塑工具箱"],
        },
    },
    "tool-box": {
        "name_zh": "工具箱工业周转系列",
        "name_en": "Tool Box & Industrial Case",
        "slug": "tool-box",
        "original": [
            ("工具箱", "Tool Box"),
            ("工业工具箱", "Tool Box"),
            ("塑料工具箱", "Plastic Tool Box"),
            ("金属工具箱", "Metal Tool Box"),
            ("周转箱", "Turnover Box"),
            ("物流周转箱", "Logistics Turnover Box"),
            ("塑料周转箱", "Plastic Turnover Box"),
            ("折叠周转箱", "Folding Turnover Box"),
            ("机修工具箱", "Maintenance Tool Box"),
            ("汽修工具箱", "Auto Repair Tool Box"),
            ("家用工具箱", "Home Tool Box"),
            ("组合工具箱", "Combo Tool Box"),
            ("抽屉式工具箱", "Drawer Tool Box"),
            ("车载工具箱", "Vehicle Tool Box"),
            ("便携工具箱", "Portable Tool Box"),
        ],
        "sub_categories": {
            "tool-box": ["工具箱", "工业工具箱", "塑料工具箱", "金属工具箱"],
            "turnover-box": ["周转箱", "物流周转箱", "塑料周转箱", "折叠周转箱"],
            "maintenance-tool-box": ["机修工具箱", "汽修工具箱", "家用工具箱", "组合工具箱"],
            "drawer-tool-box": ["抽屉式工具箱", "车载工具箱", "便携工具箱"],
        },
    },
    "camera-stage-case": {
        "name_zh": "摄影数码舞台系列",
        "name_en": "Camera & Stage Case",
        "slug": "camera-stage-case",
        "original": [
            ("摄影器材箱", "Camera Equipment Case"),
            ("相机防护箱", "Camera Case"),
            ("单反相机箱", "DSLR Camera Case"),
            ("微单相机箱", "Mirrorless Camera Case"),
            ("镜头箱", "Lens Case"),
            ("闪光灯箱", "Flash Case"),
            ("三脚架箱", "Tripod Case"),
            ("无人机摄影箱", "Drone Photography Case"),
            ("摄像机箱", "Camcorder Case"),
            ("运动相机箱", "Action Camera Case"),
            ("舞台灯光箱", "Stage Lighting Case"),
            ("音响设备箱", "Audio Equipment Case"),
            ("演出器材箱", "Performance Equipment Case"),
            ("LED 屏箱", "LED Screen Case"),
            ("麦克风箱", "Microphone Case"),
        ],
        "sub_categories": {
            "camera-case": ["摄影器材箱", "相机防护箱", "单反相机箱", "微单相机箱"],
            "lens-case": ["镜头箱", "闪光灯箱", "三脚架箱"],
            "drone-photo-case": ["无人机摄影箱", "运动相机箱"],
            "stage-lighting-case": ["舞台灯光箱", "LED 屏箱", "麦克风箱"],
            "audio-case": ["音响设备箱", "演出器材箱"],
        },
    },
    "trolley-case": {
        "name_zh": "拉杆箱商务生活系列",
        "name_en": "Trolley & Business Case",
        "slug": "trolley-case",
        "original": [
            ("拉杆箱", "Trolley Case"),
            ("商务拉杆箱", "Business Trolley Case"),
            ("旅行拉杆箱", "Travel Trolley Case"),
            ("化妆箱", "Cosmetic Case"),
            ("化妆师拉杆箱", "Makeup Artist Trolley"),
            ("美甲工具箱", "Nail Art Case"),
            ("礼品箱", "Gift Case"),
            ("商务礼品箱", "Business Gift Case"),
            ("展示箱", "Display Case"),
            ("样品展示箱", "Sample Display Case"),
            ("样品箱", "Sample Case"),
            ("会议资料箱", "Conference Document Case"),
            ("销售工具箱", "Sales Kit Case"),
        ],
        "sub_categories": {
            "trolley-case": ["拉杆箱", "商务拉杆箱", "旅行拉杆箱"],
            "cosmetic-case": ["化妆箱", "化妆师拉杆箱", "美甲工具箱"],
            "gift-case": ["礼品箱", "商务礼品箱"],
            "display-case": ["展示箱", "样品展示箱", "样品箱"],
            "business-case": ["会议资料箱", "销售工具箱"],
        },
    },
}

# 商业意图词
INTENT_KEYWORDS_ZH = ["厂家", "生产厂家", "源头工厂", "批发", "批发价格", "大量批发", "供应商", "OEM 代工", "ODM 定制", "OEM 贴牌", "定制", "来图定制", "代理加盟", "经销商", "招商代理", "出口", "全球供货", "跨境供应", "厂家直销", "现货", "小批量定制", "开模定制", "报价", "采购"]
INTENT_KEYWORDS_EN = ["Manufacturer", "Factory", "Direct Factory", "Wholesale", "Wholesale Price", "Bulk Wholesale", "Supplier", "OEM Service", "ODM Service", "OEM Private Label", "Custom", "Custom Design Service", "Agency", "Distributor", "Dealer Wanted", "Export", "Global Supply", "Cross-border Supplier", "Factory Direct Sale", "In Stock", "Low MOQ Custom", "Custom Mold Making", "Price Quote", "Procurement"]

# 中文 sub_category 关键词 → 英文 slug（保持 URL 简洁）
SUB_EN_MAP = {
    # military-tactical-case
    "军工箱": "military-grade-case", "军规防护箱": "military-grade-case", "战术转运箱": "military-grade-case", "特警装备箱": "military-grade-case",
    "军用物资运输箱": "military-grade-case", "单兵装备携行箱": "military-grade-case", "军用箱子": "tactical-military-box", "军队制式箱": "tactical-military-box",
    "军品密封箱": "tactical-military-box", "野战防爆箱": "tactical-military-box", "军绿硬壳安全箱": "tactical-military-box", "迷彩特种箱": "tactical-military-box",
    "枪械箱": "rifle-case", "战术枪箱": "rifle-case", "硬壳枪盒": "rifle-case", "射击运动行李箱": "rifle-case", "长枪箱": "rifle-case", "双枪步枪箱": "rifle-case", "狙击枪专用箱": "rifle-case",
    "子弹箱": "ammo-can", "弹药箱": "ammo-can", "铁皮子弹盒": "ammo-can", "塑料弹药周转箱": "ammo-can", "军绿色子弹箱": "ammo-can", "防水防潮弹药盒": "ammo-can",
    "手枪保护盒": "pistol-case", "短枪盒": "pistol-case", "手枪密码箱": "pistol-case", "便携战术手枪包": "pistol-case", "模块化海绵手枪盒": "pistol-case", "双层手枪防护箱": "pistol-case",
    "雷管运输箱": "detonator-case", "炸药雷管箱": "detonator-case", "危险品防爆箱": "detonator-case", "民爆物资箱": "detonator-case", "防静电雷管盒": "detonator-case", "火工品专用防护箱": "detonator-case",
    "瞄准镜保护盒": "rifle-scope-case", "光学瞄具盒": "rifle-scope-case", "红外热成像瞄准镜箱": "rifle-scope-case", "高精度狙击镜硬壳盒": "rifle-scope-case", "战术配件盒": "rifle-scope-case",
    "夜视仪防护箱": "night-vision-case", "头盔夜视仪箱": "night-vision-case", "微光夜视仪盒": "night-vision-case", "军用电光仪器箱": "night-vision-case", "防震夜视仪安全箱": "night-vision-case",
    "战术医疗箱": "tactical-medical-case", "战场急救箱": "tactical-medical-case", "军医背负箱": "tactical-medical-case", "野外搜救药箱": "tactical-medical-case", "橙色救援箱": "tactical-medical-case", "特种兵医药箱": "tactical-medical-case",
    "信号屏蔽军工箱": "rf-shielding-box", "无线隔离箱": "rf-shielding-box", "防窃听气密箱": "rf-shielding-box", "EMC 测试箱": "rf-shielding-box", "军用通信隔离箱": "rf-shielding-box", "特种信号防护箱": "rf-shielding-box",
    "抛投式空投箱": "airdrop-case", "伞兵物资箱": "airdrop-case", "高空抗坠落箱": "airdrop-case", "空投转运箱": "airdrop-case", "重型滚塑空投箱": "airdrop-case", "抗冲击坠落安全箱": "airdrop-case",
    "军用车载工具箱": "vehicle-military-tool-box", "战车随车修理箱": "vehicle-military-tool-box", "装甲车五金箱": "vehicle-military-tool-box", "重型搭扣铁锁工具箱": "vehicle-military-tool-box", "抗震随车箱": "vehicle-military-tool-box",
    "战术手电收纳盒": "tactical-flashlight-case", "强光手电盒": "tactical-flashlight-case", "单兵战术配件盒": "tactical-flashlight-case", "多格塑料小配件盒": "tactical-flashlight-case", "防水手电硬壳盒": "tactical-flashlight-case",
    "弹夹周转箱": "magazine-storage-case", "步枪弹匣盒": "magazine-storage-case", "战术胸挂配件箱": "magazine-storage-case", "压弹器收纳盒": "magazine-storage-case", "大容量弹夹防爆箱": "magazine-storage-case",
    "军标测试仪器箱": "mil-spec-equipment-case", "军规安全箱": "mil-spec-equipment-case", "美军标认证箱": "mil-spec-equipment-case", "盐雾防腐军标箱": "mil-spec-equipment-case", "高低温交变测试箱": "mil-spec-equipment-case",
    "机要文件保密箱": "secure-document-case", "密码公文箱": "secure-document-case", "防焚文件盒": "secure-document-case", "双人双锁箱": "secure-document-case", "银行押运解款箱": "secure-document-case", "政府机密档案箱": "secure-document-case",
    "防弹物资储运箱": "bullet-resistant-box", "特种装甲防爆箱": "bullet-resistant-box", "高危押运物资箱": "bullet-resistant-box", "复合碳纤维防护箱": "bullet-resistant-box", "防爆破安全箱": "bullet-resistant-box",
    "演习后勤保障箱": "military-logistics-box", "演练周转箱": "military-logistics-box", "军营仓储箱": "military-logistics-box", "重型围板箱": "military-logistics-box", "大容量折叠仓储箱": "military-logistics-box", "野战营地收纳箱": "military-logistics-box",
    "野战指挥工作站": "field-command-post-case", "便携式一体化指挥箱": "field-command-post-case", "拉杆野外办公箱": "field-command-post-case", "带折叠桌椅战术箱": "field-command-post-case", "野战电台箱": "field-command-post-case",
    "腐蚀海军舰载箱": "marine-grade-tactical-case", "船载防盐雾箱": "marine-grade-tactical-case", "潜水特种装备箱": "marine-grade-tactical-case", "高气密性硅胶圈密封箱": "marine-grade-tactical-case", "海防仪器箱": "marine-grade-tactical-case",
    # drone-case
    "无人机箱": "drone-case", "航拍器防护箱": "drone-case", "飞行器硬壳箱": "drone-case", "大疆专业箱": "dji-case", "植保无人机箱": "agri-drone-case", "测绘无人机拉杆箱": "surveying-drone-case",
    "水下无人机箱": "underwater-rov-case", "水下机器人箱": "underwater-rov-case", "潜航器防护箱": "underwater-rov-case", "水下相机箱": "underwater-camera-case", "潜水探照灯配件箱": "underwater-light-case", "水下测绘设备箱": "underwater-survey-case",
    "无人机电池防爆箱": "uav-battery-case", "锂电池充电箱": "li-battery-case", "防燃电池盒": "fireproof-battery-case", "智能电池箱": "smart-battery-case", "穿越机电池收纳盒": "fpv-battery-case", "外场多路充电箱": "multi-channel-charger-case",
    "遥控器硬壳包": "rc-transmitter-case", "遥控器保护盒": "rc-transmitter-case", "手柄收纳包": "rc-handle-case", "带屏遥控器箱": "screen-rc-case", "通用型航模遥控器硬盒": "universal-rc-case", "定制EVA 手柄盒": "custom-eva-rc-case",
    "固定翼航模运输箱": "rc-airplane-case", "航模大容量周转箱": "rc-airplane-case", "车模硬壳箱": "rc-car-case", "模型拉杆箱": "model-trolley-case", "复合板大号航空箱": "composite-aviation-case", "固定翼拆解防护箱": "fixed-wing-case",
    "无人机全套一体箱": "all-in-one-drone-case", "穿越机畅飞套装箱": "fpv-bundle-case", "全能套装硬壳箱": "all-rounder-case", "双层大容量无人机箱": "double-deck-drone-case", "御系列御3防护箱": "mavic-3-case",
    "测绘无人机RTK箱": "uav-rtk-case", "无人机地基站箱": "ground-station-case", "移动基站防护箱": "mobile-station-case", "测绘箱": "surveying-box", "激光雷达一体箱": "lidar-case", "高精度分体海绵箱": "precision-foam-case",
    "穿越机背包硬壳": "fpv-backpack", "FPV 眼镜包": "fpv-goggle-case", "穿越机硬壳双肩包": "fpv-backpack", "防撞穿越机收纳箱": "impact-resistant-fpv-case", "外挂式战术飞行包": "tactical-flight-bag",
    "机器人电机包装箱": "robotic-motor-case", "伺服电机包装盒": "servo-motor-case", "自动化关节防震箱": "robotic-joint-case", "精密丝杠保护盒": "precision-screw-case", "工业机器人配件箱": "industrial-robot-case",
    "遥控车模避震箱": "rc-car-shockproof-case", "大脚车转运箱": "monster-truck-case", "攀爬车硬壳箱": "rock-crawler-case", "车模工具箱": "rc-tool-case", "吹塑车模包装盒": "blow-mold-rc-case", "防油污配件周转箱": "oil-proof-accessory-case",
    # instrument-case
    "仪器箱": "instrument-case", "仪表箱": "instrument-case", "精密设备箱": "precision-equipment-case", "电子测试箱": "electronic-test-case", "示波器硬壳箱": "oscilloscope-case", "光谱分析仪防护箱": "spectrometer-case",
    "测绘仪器箱": "surveying-instrument-case", "经纬仪箱": "theodolite-case", "全站仪防护箱": "total-station-case", "水准仪塑料盒": "level-instrument-case", "三维激光扫描仪箱": "3d-scanner-case", "GPS手簿保护盒": "gps-handheld-case",
    "环保检测仪器箱": "environmental-tester-case", "气体检测仪箱": "gas-detector-case", "水质分析仪箱": "water-analyzer-case", "采样设备箱": "sampling-case", "环评多参数测试仪箱": "multi-param-tester-case", "空气采样罐箱": "air-sampling-case",
    "探伤仪防护箱": "flaw-detector-case", "超声波探伤仪箱": "ultrasonic-flaw-case", "无损检测设备箱": "ndt-equipment-case", "射线箱": "radiation-case", "钢结构检测仪便携箱": "steel-structure-case", "工业测厚仪盒": "thickness-gauge-case",
    "光纤熔接机箱": "fusion-splicer-case", "光缆施工工具箱": "cable-construction-case", "通信工程箱": "telecom-engineering-case", "光纤测试仪硬壳箱": "fiber-tester-case", "网络排障手提箱": "network-troubleshoot-case",
    "气象仪器携带箱": "meteorological-case", "天气监测设备箱": "weather-station-case", "风速仪防护箱": "anemometer-case", "雨量计箱": "rain-gauge-case", "野外气象站便携箱": "field-weather-case", "传感器收纳硬箱": "sensor-storage-case",
    "热成像仪保护盒": "thermal-imager-case", "红外热像仪箱": "infrared-thermal-case", "夜视热成像盒": "night-thermal-case", "测温仪盒": "thermometer-case", "手持式热分析仪箱": "handheld-thermal-case", "消防热成像防护盒": "firefighter-thermal-case",
    "地质勘探采样箱": "geological-sampling-box", "矿石采样箱": "ore-sampling-case", "岩心收纳保护箱": "core-storage-case", "化石盒": "fossil-case", "野外勘探地质锤箱": "field-hammer-case", "土壤采样器材箱": "soil-sampling-case",
    "内窥镜防护箱": "endoscope-case", "工业内窥镜箱": "industrial-endoscope-case", "管道检测仪便携箱": "pipe-inspection-case", "胃镜箱": "gastroscope-case", "蛇形管探头收纳箱": "snake-probe-case", "高清监视器一体箱": "hd-monitor-case",
    "激光测距仪盒": "laser-rangefinder-case", "测距仪保护套": "rangefinder-sleeve", "手持测量仪盒": "handheld-measurement-case", "雷达防护盒": "radar-protection-case", "激光雷达硬壳保护盒": "lidar-protection-case", "高尔夫测距仪包": "golf-rangefinder-case",
    "数据采集模块箱": "data-acquisition-case", "信号采集箱": "signal-acquisition-case", "物联网网关箱": "iot-gateway-case", "工控机外壳": "industrial-pc-case", "边缘计算设备箱": "edge-computing-case", "现场数据记录仪箱": "field-data-logger-case",
    "防静电芯片盒": "esd-chip-case", "晶圆导电盒": "wafer-conductive-case", "电子元件防静电箱": "esd-electronic-case", "IC 小料盒": "ic-component-case", "导电 PP 注塑盒": "conductive-pp-case", "无尘室防静电周转箱": "cleanroom-esd-case",
    "精密量具量规盒": "precision-gauge-box", "游标卡尺盒": "vernier-caliper-case", "千分尺塑料盒": "micrometer-case", "塞规环规盒": "plug-ring-gauge-case", "针规高防锈保护盒": "pin-gauge-case", "百分表防震硬盒": "dial-indicator-case",
    "传感器信号采集箱": "sensor-interface-box", "工业传感器外壳": "industrial-sensor-case", "多路信号转换箱": "multi-channel-signal-case", "铝制仪表壳体": "aluminum-instrument-case", "阻燃 ABS 工控盒": "fr-abs-control-box",
    "手持打标机便携箱": "portable-laser-marking-case", "激光打码机外壳": "laser-coding-case", "手持喷码机包装箱": "inkjet-printer-case", "工业级便携打标机防护箱": "industrial-marking-case",
    # waterproof-case
    "防水箱": "waterproof-case", "全密封防水箱": "fully-sealed-waterproof-case", "IP67 防尘防水箱": "ip67-waterproof-case", "防爆水箱": "explosion-proof-water-case", "海上漂浮防水箱": "floating-waterproof-case", "潜水手提安全箱": "dive-waterproof-case",
    "户外箱": "outdoor-dry-box", "户外露营收纳箱": "camping-storage-case", "野外生存硬壳箱": "wilderness-survival-case", "自驾箱": "road-trip-case", "越野车外挂箱": "off-road-exterior-case", "后备箱多功能储物箱": "trunk-storage-case",
    "保护盒箱": "small-protective-case", "迷你防护盒": "mini-protective-case", "便携硬壳胶盒": "portable-hard-case", "数码保护盒": "digital-protective-case", "钥匙防盗安全盒": "key-security-case", "户外随身防水盒": "outdoor-portable-waterproof-case",
    "防潮箱": "moisture-proof-dry-box", "相机防潮柜": "camera-dry-cabinet", "电子吸湿干燥箱": "electronic-dehumidifier-case", "气密防潮箱": "airtight-moisture-proof-case", "气密性防潮吸湿硬箱": "airtight-desiccant-case", "中药材防潮保护盒": "herb-moisture-case",
    "潜水装备防护箱": "scuba-gear-case", "潜水镜脚蹼收纳箱": "scuba-mask-fins-case", "潜水电筒箱": "dive-light-case", "专业潜水大容量防水箱": "pro-scuba-waterproof-case", "重型卡扣密封箱": "heavy-latch-sealed-case",
    "船用密封仪器箱": "marine-sealed-case", "游艇防水工具箱": "yacht-tool-case", "海工设备防盐雾箱": "marine-anti-salt-case", "船舶救生设备收纳箱": "ship-lifesaver-case", "海上急救密封箱": "marine-first-aid-case",
    "钓鱼配件防水盒": "fishing-tackle-box", "路亚饵盒": "lure-box", "钓鱼线轮保护盒": "fishing-reel-case", "鱼钩盒": "fish-hook-box", "多格防水钓鱼配件箱": "multi-compartment-tackle-box", "台钓主线盒": "tai-fishing-line-box",
    "户外电源保护箱": "portable-power-station-case", "移动电源硬壳箱": "power-bank-case", "储能电池防护箱": "battery-storage-case", "太阳能折叠板收纳箱": "solar-folding-case", "逆变器一体外壳": "inverter-case",
    "漂流防水手提箱": "drifting-case", "溯溪防水包": "stream-tracing-bag", "水上运动密封箱": "water-sport-case", "冲浪盒": "surfing-case", "充气艇备用物资箱": "inflatable-boat-case", "防沙手机密封盒": "sand-proof-phone-case",
    "探险物资密封箱": "expedition-case", "极地探险保温箱": "polar-insulation-case", "无人区科考箱": "wilderness-research-case", "防冻箱": "anti-freeze-case", "恶劣气候全天候防护箱": "all-weather-case", "-40 度耐寒箱": "minus-40-cold-case",
    "自驾车顶顶棚箱": "car-roof-cargo-box", "车顶行李箱": "roof-luggage-box", "车顶纵梁外挂箱": "roof-rail-exterior-case", "车尾工具箱": "tail-tool-case", "越野加装工具箱": "off-road-tool-case", "皮卡后斗重型密封箱": "pickup-trunk-case",
    "带排气阀安全箱": "auto-pressure-valve-case", "自动排气防水箱": "auto-vent-waterproof-case", "高原防吸附密封箱": "high-altitude-sealed-case", "空运自动平衡气压箱": "air-pressure-balance-case", "防压抗凹陷箱": "anti-crush-case",
    "防尘工业安全箱": "dustproof-safety-case", "IP6X 防尘箱": "ip6x-dustproof-case", "沙漠风沙防护箱": "desert-dust-case", "矿山采掘设备防护箱": "mining-equipment-case", "水泥厂点检箱": "cement-plant-case",
    "重型抗压防护箱": "heavy-duty-case", "耐磨抗摔防护箱": "wear-resistant-case", "工业级防压箱": "industrial-crush-case", "卡车用箱": "truck-case", "承重型工程塑料防护箱": "load-bearing-case", "堆叠不顶翻箱": "stackable-case",
    "防紫外线抗老化箱": "anti-uv-case", "耐黄变户外箱": "yellowing-resistant-case", "抗紫外线塑料防护箱": "uv-resistant-plastic-case", "长期暴晒不脆化安全箱": "long-sun-exposure-case", "光伏控制箱": "solar-control-box",
    # medical-case
    "医疗箱": "medical-first-aid-box", "医药箱": "medical-first-aid-box", "家庭急救箱": "home-first-aid-box", "医生出诊箱": "doctor-visit-case", "学校保健室医药箱": "school-medical-box", "公司工厂应急药箱": "corporate-first-aid-box",
    "医疗仪器箱": "medical-instrument-case", "体检一体机箱": "checkup-case", "透析机箱": "dialysis-case", "激光医疗设备外壳": "medical-laser-case", "便携式B超机防护箱": "portable-ultrasound-case",
    "医疗试剂冷藏箱": "medical-refrigerator-case", "血液运输保温箱": "blood-transport-case", "疫苗冷链箱": "vaccine-cold-chain-case", "取样箱": "sampling-case", "实验室生物样品采样箱": "lab-bio-sampling-case", "干冰冷冻箱": "dry-ice-case",
    "医疗急救转运箱": "medical-emergency-case", "120 随车急救箱": "ambulance-case", "出诊医药箱": "outcall-medical-case", "除颤仪箱": "defibrillator-case", "院前急救呼吸机箱": "pre-hospital-ventilator-case", "AED 自动除颤仪保护盒": "aed-case",
    "基因检测设备箱": "genetic-analyzer-case", "DNA 检测仪箱": "dna-tester-case", "实验室便携设备箱": "lab-portable-case", "核酸箱": "nucleic-acid-case", "移动核酸检测箱": "mobile-pcr-case", "病毒采样管转运箱": "virus-sampling-case",
    "牙科器材携带箱": "dental-equipment-case", "种植牙工具盒": "implant-tool-case", "正畸器材收纳箱": "orthodontic-case", "牙模盒": "dental-model-case", "便携式牙科诊疗一体箱": "portable-dental-case", "根管治疗工具盒": "root-canal-case",
    "听诊器医生随身包": "stethoscope-case", "医生诊断包": "doctor-diagnostic-bag", "血压计便携保护盒": "blood-pressure-case", "药剂盒": "medicine-box", "电子血压计盒": "electronic-bp-monitor-case", "家用医疗收纳盒": "home-medical-case",
    "生物安全转运箱": "biological-specimen-carrier", "UN3373 标准高危样本箱": "un3373-case", "高传染性标本箱": "high-infectious-case", "临床试验标本干冰箱": "clinical-trial-case", "防泄漏三层包装箱": "leak-proof-3-layer-case",
    "腹透液恒温拉杆箱": "peritoneal-dialysis-warmer", "腹透液恒温加热箱": "pd-warming-case", "医疗拉杆恒温箱": "medical-trolley-warmer", "尿毒症患者出行保障箱": "dialysis-patient-case", "车载恒温箱": "vehicle-warmer-case",
    "手术医疗五金工具箱": "surgical-tool-case", "手术刀具消毒箱": "surgical-sterilization-case", "骨科内固定器械盒": "orthopedic-implant-case", "铝合金高压灭菌盒": "aluminum-sterilization-case", "不锈钢打孔清洗盒": "stainless-cleaning-case",
    # tool-box
    "工具箱": "tool-box", "工业工具箱": "industrial-tool-box", "塑料工具箱": "plastic-tool-box", "金属工具箱": "metal-tool-box", "周转箱": "turnover-box", "物流周转箱": "logistics-turnover-box", "塑料周转箱": "plastic-turnover-box", "折叠周转箱": "folding-turnover-box", "机修工具箱": "maintenance-tool-box", "汽修工具箱": "auto-repair-tool-box", "家用工具箱": "home-tool-box", "组合工具箱": "combo-tool-box", "抽屉式工具箱": "drawer-tool-box", "车载工具箱": "vehicle-tool-box", "便携工具箱": "portable-tool-box",
    # camera-stage-case
    "摄影器材箱": "camera-equipment-case", "相机防护箱": "camera-case", "单反相机箱": "dslr-camera-case", "微单相机箱": "mirrorless-camera-case", "镜头箱": "lens-case", "闪光灯箱": "flash-case", "三脚架箱": "tripod-case", "无人机摄影箱": "drone-photography-case", "摄像机箱": "camcorder-case", "运动相机箱": "action-camera-case", "舞台灯光箱": "stage-lighting-case", "音响设备箱": "audio-equipment-case", "演出器材箱": "performance-equipment-case", "LED 屏箱": "led-screen-case", "麦克风箱": "microphone-case",
    # trolley-case
    "拉杆箱": "trolley-case", "商务拉杆箱": "business-trolley-case", "旅行拉杆箱": "travel-trolley-case", "化妆箱": "cosmetic-case", "化妆师拉杆箱": "makeup-trolley-case", "美甲工具箱": "nail-art-case", "礼品箱": "gift-case", "商务礼品箱": "business-gift-case", "展示箱": "display-case", "样品展示箱": "sample-display-case", "样品箱": "sample-case", "会议资料箱": "conference-doc-case", "销售工具箱": "sales-kit-case",
}

def get_sub_en(sub_zh):
    return SUB_EN_MAP.get(sub_zh, _py_slugify(sub_zh))

def _py_slugify(s):
    if not s:
        return ""
    import re as _re
    s = str(s).strip().lower()
    s = _re.sub(r"[^\w\s\u4e00-\u9fff-]", "", s)
    s = _re.sub(r"\s+", "-", s)
    s = _re.sub(r"-+", "-", s).strip("-")
    return s[:80]

# 特性词
FEATURES_ZH = ["防水", "IP67 防水", "IP68 防水", "防尘", "防震", "防爆", "防潮", "防静电", "防腐", "耐高温", "耐低温", "抗紫外线", "重型", "轻量化", "高强度", "密封", "气密", "带轮", "带拉杆", "带海绵内衬", "可堆叠", "带锁", "军规级", "便携式", "玻纤增强"]
FEATURES_EN = ["Waterproof", "IP67 Waterproof", "IP68 Waterproof", "Dustproof", "Shockproof", "Explosion-proof", "Moisture-proof", "Anti-static", "Corrosion-resistant", "Heat-resistant", "Cold-resistant", "UV-resistant", "Heavy-duty", "Lightweight", "High-strength", "Sealed", "Airtight", "Wheeled", "with Trolley Handle", "with Foam Insert", "Stackable", "Lockable", "MIL-SPEC", "Portable", "Glass Fiber Reinforced"]

# 规格词
SPECS_ZH = ["小型", "中型", "大型", "超大", "迷你", "加长", "加深"]
SPECS_EN = ["Small", "Medium", "Large", "Extra Large", "Mini", "Long", "Deep"]

# 市场词
MARKETS_ZH = ["出口欧美市场", "出口东南亚市场", "出口中东市场", "出口非洲市场", "出口俄罗斯市场", "出口南美市场", "出口澳洲市场", "出口日韩市场"]
MARKETS_EN = ["Export for US & Europe Market", "Export for Southeast Asia", "Export for Middle East", "Export for Africa", "Export for Russia", "Export for South America", "Export for Australia", "Export for Japan & Korea"]

# 疑问词
QUESTIONS_ZH = ["哪家好", "多少钱", "怎么选", "排行榜", "生产流程", "定制流程", "起订量", "OEM 流程", "ODM 流程", "出口流程", "认证流程", "哪家便宜", "如何选型", "哪种材质好"]
QUESTIONS_EN = ["which is the best", "how much", "how to choose", "top 10", "manufacturing process", "customization process", "MOQ", "OEM process", "ODM process", "export process", "certification process", "which is cheap", "how to select", "which material is best"]

def main():
    no = 0
    out = OrderedDict()
    out["_meta"] = {
        "version": "1.0-seed",
        "source": "箱体行业关键词布局报告(全量版).pdf (seed: 基于已知原始词+规则扩展)",
        "extracted_at": "2026-07-29",
        "note": "OCR 全量提取将在完成后覆盖此文件",
    }
    out["product_lines"] = {}

    for slug, line in PRODUCT_LINE_KEYWORDS.items():
        keywords = []

        # 1) 原始词
        for zh, en in line["original"]:
            no += 1
            keywords.append({"no": no, "zh": zh, "en": en, "layer": "原始"})

        # 2) 商业意图词（每个原始词组合 24 个商业意图）
        for zh, en in line["original"]:
            for intent_zh, intent_en in zip(INTENT_KEYWORDS_ZH, INTENT_KEYWORDS_EN):
                no += 1
                keywords.append({"no": no, "zh": f"{zh}{intent_zh}", "en": f"{en} {intent_en}", "layer": "商业"})

        # 3) 特性词
        for sub_zhs in line["sub_categories"].values():
            for sub_zh in sub_zhs:
                sub_en = get_sub_en(sub_zh)
                for f_zh, f_en in zip(FEATURES_ZH, FEATURES_EN):
                    no += 1
                    keywords.append({"no": no, "zh": f"{f_zh}{sub_zh}", "en": f"{f_en} {sub_en}", "layer": "特性"})

        # 4) 规格词
        for sub_zhs in line["sub_categories"].values():
            for sub_zh in sub_zhs:
                sub_en = get_sub_en(sub_zh)
                for spec_zh, spec_en in zip(SPECS_ZH, SPECS_EN):
                    for intent_zh, intent_en in zip(["厂家", "批发"], ["Manufacturer", "Wholesale"]):
                        no += 1
                        keywords.append({"no": no, "zh": f"{spec_zh}{sub_zh}{intent_zh}", "en": f"{spec_en} {sub_en} {intent_en}", "layer": "规格"})

        # 5) 长尾词（特性 + 产品 + 商业意图）
        for sub_slug, sub_zhs in line["sub_categories"].items():
            for sub_zh in sub_zhs[:3]:  # 取前 3 个核心词
                sub_en = get_sub_en(sub_zh)
                for f_zh, f_en in zip(FEATURES_ZH[:8], FEATURES_EN[:8]):  # 取前 8 个特性
                    for intent_zh, intent_en in zip(["厂家", "批发", "OEM 代工", "出口"], ["Manufacturer", "Wholesale", "OEM Service", "Export"]):
                        no += 1
                        keywords.append({"no": no, "zh": f"{f_zh}{sub_zh}{intent_zh}", "en": f"{f_en} {sub_en} {intent_en}", "layer": "长尾"})

        # 6) 市场词
        for sub_zhs in line["sub_categories"].values():
            for sub_zh in sub_zhs[:2]:
                sub_en = get_sub_en(sub_zh)
                for m_zh, m_en in zip(MARKETS_ZH, MARKETS_EN):
                    no += 1
                    keywords.append({"no": no, "zh": f"{sub_zh}{m_zh}", "en": f"{sub_en} {m_en}", "layer": "市场"})

        # 7) 疑问词
        for sub_zhs in line["sub_categories"].values():
            for sub_zh in sub_zhs[:2]:
                sub_en = get_sub_en(sub_zh)
                for q_zh, q_en in zip(QUESTIONS_ZH, QUESTIONS_EN):
                    no += 1
                    keywords.append({"no": no, "zh": f"{sub_zh}{q_zh}", "en": f"{sub_en} {q_en}", "layer": "疑问"})

        out["product_lines"][slug] = {
            "name_zh": line["name_zh"],
            "name_en": line["name_en"],
            "slug": line["slug"],
            "keywords": keywords,
        }

    out["_meta"]["total"] = no
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"Written: {no} keywords → {OUT} ({OUT.stat().st_size//1024} KB)")
    for slug, line in out["product_lines"].items():
        print(f"  {slug}: {len(line['keywords'])}")

if __name__ == "__main__":
    main()
