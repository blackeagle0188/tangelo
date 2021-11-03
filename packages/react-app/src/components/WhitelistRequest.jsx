import React from "react";
import { Layout, Button, Typography } from "antd";

const { Content } = Layout;
const { Text } = Typography;

export default function WhitelistRequest({ image, name }) {
  const handleClick = () => {
    window.open("https://discord.gg/XTR8F8hZZB", "_blank");
  };

  return (
    <Layout className="borrow_card">
      <img src={image} alt="card" />
      <Content className="card_details">
        <Text className="righteous collection details">{name}</Text>
        <Text className="borrow_eth righteous">not yet whitelisted</Text>
        <Button className="btn_request btn blue righteous" onClick={handleClick}>
          request in discord
        </Button>
      </Content>
    </Layout>
  );
}
