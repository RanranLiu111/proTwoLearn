import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import router from 'umi/router';
import numeral from 'numeral';
import {
  Table,
  Row,
  Col,
  Card,
  Form,
  Input,
  Select,
  Icon,
  Button,
  Dropdown,
  Menu,
  InputNumber,
  DatePicker,
  Modal,
  message,
  Badge,
  Divider,
  Steps,
  Radio,
} from 'antd';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from '../../css/common.less';
import {getSupplyStatusLabel,transFigureToPercent} from '../../utils/commonFunc';
import { changeSupplyStatus } from '../../services/api';

const FormItem = Form.Item;
const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;
const RadioGroup = Radio.Group;
const getValue = obj =>
  Object.keys(obj)
    .map(key => obj[key])
    .join(',');
const statusMap = ['default', 'processing', 'success', 'error'];
const status = ['关闭', '运行中', '已上线', '异常'];


@Form.create()
@connect(({ supplies, loading }) => ({
  supplies,
  loading: loading.models.supplies,
}))
class TableList extends PureComponent {
  state = {
    statistic_by:undefined
  };

  columns = [
    {
      title: 'ID {aff_id}',
      dataIndex: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Company',
      dataIndex: 'company_name',
      render:(text,record)=>{
        const company = record.company || {};
        return company.name
      }
    },
    {
      title: 'BD',
      dataIndex: 'bd_name',
    },
    {
      title: 'AM',
      dataIndex: 'am_name',
    },
    {
      title: 'Status',
      dataIndex: 'banned',
      render:(text)=>{
        return getSupplyStatusLabel(text)
      }
    },
    {
      title: 'Clicks',
      dataIndex: 'clicks',
      render: text => numeral(text).format('0,0') 
    },
    {
      title: 'Conversions',
      dataIndex: 'conversions',
      render: text => numeral(text).format('0,0') 
    },
    {
      title: 'CR,%',
      dataIndex: 'cr',
      render: text => transFigureToPercent(text)
    },
    {
      title: 'EPC',
      dataIndex: 'epc',
      render: text => numeral(text).format('0,0.00') 
    },
    {
      title: 'Spend',
      dataIndex: 'spend',
      render: text => numeral(text).format('0,0.00') 
    },
    {
      title: 'Earnings',
      dataIndex: 'earnings',
      render: text => numeral(text).format('0,0.00') 
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      render: text => numeral(text).format('0,0.00') 
    },
    {
      title: 'ROI,%',
      dataIndex: 'roi',
      render: text => transFigureToPercent(text)
    },
    {
      title: 'Action',
      dataIndex: '',
      render:(text,record) => {
        const setMenu = (
          <Menu onClick={this.changeRowStatus.bind(this,record)}>
            <Menu.Item key="1">
              Ban
            </Menu.Item>
            <Menu.Item key="2">
              reOpen
            </Menu.Item>
          </Menu>
        );
        return (
          <div className={styles.tableActsWrapper}>
            <a onClick={this.editRowInfo.bind(this,record)}>Edit</a>
            <Divider type="vertical" />
            <Dropdown overlay={setMenu}>
              <a>Set <Icon type="down" /></a>
            </Dropdown>
          </div>
        )
      }
    },
  ];

  componentDidMount() {
    this.fetchDataList()
  }

  changeRowStatus = (record,{key}) => {
    const { supplies:{ dataList },dispatch } = this.props;
    let params = {aff_id:record.aff_id,status:Number(key)};
    const response = changeSupplyStatus(params)
    response.then(json => {
      if(json.code === 0){
        message.success('Success');
        let tempDataList = dataList.map((item)=>{
          if(item.aff_id == record.aff_id){
            item.status = Number(key) 
          }
          return item
        })
        dispatch({
          type:'supplies/asyncDataList',
          payload:tempDataList
        })
      }
    })
  }

  searchFormReset = () => {
    const { form, dispatch ,supplies:{ pageSettings:{ page_size }}} = this.props;
    form.resetFields();
    const pageSet = { page:1,page_size:page_size};
    this.fetchDataList({},pageSet)
    dispatch({
      type:'supplies/asyncFormValues',
      payload:{}
    })
    dispatch({
      type:'supplies/asyncPageSettings',
      payload:pageSet
    })
  };

  searchFormSubmit = e => {
    e.preventDefault();
    const { dispatch, form, supplies:{ pageSettings:{ page_size }, formValues} } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      // const formVal = fieldsValue;
      const pageSet = { page:1,page_size:page_size};
      this.fetchDataList(fieldsValue,pageSet)
      dispatch({
        type:'supplies/asyncFormValues',
        payload:fieldsValue
      })
      dispatch({
        type:'supplies/asyncPageSettings',
        payload:pageSet
      })
    });
  };

  renderSearchForm() {
    const {
      form: { getFieldDecorator },
    } = this.props;
    return (
      <Form onSubmit={this.searchFormSubmit} layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="Search">
              {getFieldDecorator('keywords')(<Input placeholder="ID, Name, Company" autoComplete="off" />)}
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="Status">
              {getFieldDecorator('status')(
                <Select placeholder="Select" allowClear style={{ width: '100%' }}>
                  <Option value={-1}>All</Option>
                  <Option value={0}>Normal</Option>
                  <Option value={1}>Banned</Option>
                </Select>
              )}
            </FormItem>
          </Col>
          <div style={{ float: 'right', marginBottom: 24 ,marginRight:24}}>
            <Button type="primary" htmlType="submit">
              Query
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={this.searchFormReset}>
              Reset
            </Button>
          </div>
        </Row>
      </Form>
    );
  }

  newSupply = () =>{
    router.push({
      pathname: '/supplies/newSupply',
    });
  }

  editRowInfo = (record) => {
    this.props.history.push({
      pathname:'/supplies/editSupply',
      state:{info:record},
    })
  }

  changeStatistics = (value) => {
    this.setState({
      statistic_by:value
    },()=>{
      this.fetchDataList()
    })
  }

  pageChange = (page, pageSize) => {
    const pageSet = {page:page,page_size:pageSize};
    this.props.dispatch({
      type:'supplies/asyncPageSettings',
      payload:pageSet,
    })
    this.fetchDataList(null,pageSet)
  }

  pageSizeChange = (current, size) => {
    const pageSet = {page:1,page_size:size}
    this.props.dispatch({
      type:'supplies/asyncPageSettings',
      payload:pageSet,
    })
    this.fetchDataList(null, pageSet)
  }

  fetchDataList = (formVal,pageSet) => {
    const { dispatch, supplies:{ formValues,pageSettings } } = this.props;
    const formParams = formVal || formValues;
    const pageParams = pageSet || pageSettings;
    const singleParams = {statistic_by:this.state.statistic_by}
    dispatch({
      type: 'supplies/fetch',
      payload: {...formParams,...pageParams,...singleParams}
    });
  }

  render() {
    const { supplies: { dataList ,pageSettings: { page, page_size } }, loading } = this.props;
    return (
      <PageHeaderWrapper>
        <Card bordered={false}>
          <div>
            <div className={`${styles.searchFormWrapper} ${styles.searchSupplies}`}>{this.renderSearchForm()}</div>
            <div className={styles.operateWrapper}>
              <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
                <Col md={8} sm={24}>
                  <Button icon="plus" onClick={this.newSupply}>New Supply</Button>
                </Col>
                <Col md={16} sm={24}>
                  <div className={styles.rightOptWrapper}>
                    <label>Statistics By Recently：</label>
                    <Select placeholder="Select" allowClear style={{ width: 230 }} onChange={this.changeStatistics}>
                      <Option value="1">Today</Option>
                      <Option value="2">Last 2 Days</Option>
                      <Option value="3">Last 7 Days</Option>
                    </Select>
                  </div>
                </Col>
              </Row>
            </div>
            <div className={styles.commonTableWrapper}>
              <Table
                bordered
                size='small'
                rowKey='uniqueKey'
                loading={loading}
                dataSource={dataList}
                columns={this.columns}
                pagination={{
                  showSizeChanger:true,
                  pageSizeOptions:['10', '20', '50', '100'],
                  current:page,
                  pageSize:page_size,
                  onChange:this.pageChange,
                  onShowSizeChange:this.pageSizeChange,
                }}
              />
            </div>
          </div>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default TableList;
