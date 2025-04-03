import React, { useEffect } from "react";
import { Users, DollarSign, Percent } from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/Card";
import Tabs from "../ui/Tabs";
import StatCard from "./StatCard";
import RequestList from "../requests/RequestList";
import Button from "../ui/Button";
import { Node, WhitelistRequest } from "../../types";
import { formatRune } from "../../lib/utils";
import Dropdown from "../ui/Dropdown";
import { baseAmount } from "@xchainjs/xchain-util";
import { useWallet } from "../../contexts/WalletContext";

interface OperatorDashboardProps {
  nodes: Node[];
  requests: WhitelistRequest[];
  onApproveRequest: (request: WhitelistRequest) => void;
  onRejectRequest: (request: WhitelistRequest) => void;
  onEditListing: () => void;
  onDeleteListing: () => void;
}

const OperatorDashboard: React.FC<OperatorDashboardProps> = ({
  nodes,
  requests,
  onApproveRequest,
  onRejectRequest,
  onEditListing,
  onDeleteListing,
}) => {
  const { address } = useWallet();
  const [selectedNodeValue, setSelectedNodeValue] = React.useState<string>(
    nodes[0]?.nodeAddress
  );

  useEffect(() => {
    setSelectedNodeValue(nodes[0]?.nodeAddress);
  }, [nodes]);

  const options = nodes.map((node) => ({
    value: node.nodeAddress,
    label: node.nodeAddress,
  }));
  const selectedNode = nodes.find((n) => n.nodeAddress === selectedNodeValue);

  const pendingRequests = requests.filter(
    (req) =>
      req.status === "pending" &&
      req.node.nodeAddress === selectedNode?.nodeAddress
  );
  const approvedRequests = requests.filter(
    (req) =>
      req.status === "approved" &&
      req.node.nodeAddress === selectedNode?.nodeAddress
  );
  const rejectedRequests = requests.filter(
    (req) =>
      req.status === "rejected" &&
      req.node.nodeAddress === selectedNode?.nodeAddress
  );
  const bondedRequests = requests.filter(
    (req) =>
      req.status === "bonded" &&
      req.node.nodeAddress === selectedNode?.nodeAddress
  );

  const totalBonded = bondedRequests.reduce(
    (sum, req) => sum + req.realBond,
    0
  );
  const remainingCapacity = selectedNode
    ? selectedNode.maxRune - totalBonded
    : 0;

  if (!selectedNode && address) {
    return (
      <div className="text-center py-12">
        <img
          src="/runebond-logo.png"
          alt="RuneBond Logo"
          className="w-32 h-32 mx-auto mb-8"
        />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome Node Operator
        </h2>
        <p className="text-gray-600 mb-8">
          Create a listing to start accepting bonding requests from users.
        </p>
        {<Button onClick={onEditListing}>Create New Listing</Button>}
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-8">No node operator found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Node Operator Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {selectedNode?.operatorAddress}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-4">
          <Dropdown
            label="Select one of your nodes"
            options={options}
            value={selectedNodeValue}
            onChange={(value) => setSelectedNodeValue(value)}
            placeholder="Choose a node"
          />
          {address === selectedNode?.operatorAddress && (
            <>
              <Button variant="outline" onClick={onEditListing}>
                New Listing
              </Button>
              <Button variant="danger" onClick={onDeleteListing} disabled>
                Delete Listing
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Available Capacity"
          value={`${formatRune(baseAmount(remainingCapacity))} RUNE`}
          icon={DollarSign}
          description={`${formatRune(baseAmount(totalBonded))} RUNE bonded`}
        />
        <StatCard
          title="Minimum Bond"
          value={`${formatRune(baseAmount(selectedNode?.minRune))} RUNE`}
          icon={DollarSign}
        />
        <StatCard
          title="Fee Percentage"
          value={`${selectedNode?.feePercentage / 100}%`}
          icon={Percent}
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests.length}
          icon={Users}
          description={`${approvedRequests.length} approved, ${rejectedRequests.length} rejected`}
        />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">
            Whitelist Requests
          </h2>
        </CardHeader>
        <CardContent>
          <Tabs
            tabs={[
              {
                id: "pending",
                label: `Pending (${pendingRequests.length})`,
                content: (
                  <RequestList
                    requests={pendingRequests}
                    actionList={
                      address === selectedNode?.operatorAddress
                        ? [
                            {
                              title: "Approve",
                              type: "primary",
                              action: onApproveRequest,
                            },
                            {
                              title: "Reject",
                              isDisabled: () => true,
                              type: "danger",
                              action: onRejectRequest,
                            },
                          ]
                        : []
                    }
                  />
                ),
              },
              {
                id: "approved",
                label: `Approved (${approvedRequests.length})`,
                content: <RequestList requests={approvedRequests} />,
              },
              {
                id: "rejected",
                label: `Rejected (${rejectedRequests.length})`,
                content: <RequestList requests={rejectedRequests} />,
              },
              {
                id: "bonded",
                label: `Bonded (${bondedRequests.length})`,
                content: (
                  <RequestList
                    requests={bondedRequests}
                    actionList={
                      address === selectedNode?.operatorAddress
                        ? [
                            {
                              title: "Revoke",
                              isDisabled: () => true,
                              action: () => console.log("Pending implement"),
                              type: "danger",
                            },
                          ]
                        : []
                    }
                  />
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default OperatorDashboard;
