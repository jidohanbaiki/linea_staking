import { useAccount, useReadContracts, useWatchBlockNumber, useWriteContract } from "wagmi";
import { erc20Abi } from 'viem'
import CONTRACT_ABI from "./abi.json";
const CONTRACT_ADDRESS = "0x2df41652713069B8f05539d9E0E93ADaffCAcA78";
import type { NextPage } from 'next';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

const tokens: { value: `0x${string}`; label: string }[] = [
  {
    value: "0x46871676658472B99720F2a368CDa6430c1647b9",
    label: "COFFEE",
  },
  {
    value: "0xB7D70343639aF53a02f6ea7d9cde240fc72de6Dd",
    label: "TEA",
  },
  {
    value: "0x66a6F52C2100FB82EE21FD1380b4D516CB540c93",
    label: "WATER",
  },
];

const TokensCombobox = ({ value, setValue, disabled }: any) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value
            ? tokens.find((token) => token.value === value)?.label
            : "Select token..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search by address..." />
          <CommandList>
            <CommandEmpty>No token found.</CommandEmpty>
            <CommandGroup>
              {tokens.map((token) => (
                <CommandItem
                  key={token.value}
                  value={token.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === token.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {token.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const StakingCard = ({ account, disabled }: any) => {
  const [menuTab, setMenuTab] = useState<"stake" | "unstake">("stake");
  const [token, setToken] = useState<`0x${string}`>(tokens[0].value);
  const [amountToStake, setAmountToStake] = useState<number>(0);
  const [amountToUnstake, setAmountToUnstake] = useState<number>(0);
  const [amountStakable, setAmountStakable] = useState<number>(0);
  const [amountStaked, setAmountStaked] = useState<number>(0);
  const { writeContract, isPending } = useWriteContract();

  const [blockNumber, setBlockNumber] = useState<bigint>(BigInt(0));
  useWatchBlockNumber({
    onBlockNumber(blockNumber) {
      setBlockNumber(blockNumber);
    },
  })

  const { data, isSuccess, isLoading } = useReadContracts({
    allowFailure: false,
    blockNumber,
    contracts: [
      // Token decimals
      {
        address: token,
        abi: erc20Abi,
        functionName: "decimals",
      },
      // Stakable
      {
        address: token,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account.address],
      },
      // Staked
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "stakedBalances",
        args: [account.address, token],
      },
      //Allowance
      {
        address: token,
        abi: erc20Abi,
        functionName: "allowance",
        args: [account.address, CONTRACT_ADDRESS],
      },
    ],
  });
  
  useEffect(() => {
    if (isSuccess) {
      const decimals = data?.[0] ?? 18;
      const stakable = Number((data?.[1] as bigint) ?? 0) / 10 ** decimals;
      const staked = Number((data?.[2] as bigint) ?? 0) / 10 ** decimals;
      setAmountStakable(stakable);
      setAmountStaked(staked);
    }
  }, [data]);

  useEffect(() => {
        setAmountToStake(0);
        setAmountToUnstake(0);
    }, [token])

  return (
    <Card className="w-full max-w-sm relative">
      {disabled && (
        <div className="z-50 backdrop-blur-[3px] rounded-lg absolute inset-0 flex items-center justify-center">
          <p className="text-md text-gray-500">
            Please connect your wallet first
          </p>
        </div>
      )}

      <div className="absolute text-xs text-gray-500 top-0 right-0 p-4">
        Available to stake: {amountStakable}
        <br />
        Amount staked: {amountStaked}
      </div>

      <CardHeader>
        <CardTitle className="text-2xl">Linea Staking</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="targetToken">Token</Label>
          <TokensCombobox
            id="targetToken"
            value={token}
            setValue={setToken}
            disabled={disabled}
          />
        </div>

        <Tabs defaultValue="stake" value={menuTab}>
          <TabsList
            className="grid w-full grid-cols-2"
            hidden={amountStakable === 0 || amountStaked === 0}
          >
            <TabsTrigger
              value="stake"
              disabled={amountStakable === 0}
              onClick={() => setMenuTab("stake")}
            >
              Stake
            </TabsTrigger>
            <TabsTrigger
              value="unstake"
              disabled={amountStaked === 0}
              onClick={() => setMenuTab("unstake")}
            >
              Unstake/Withdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stake">
            <div className="grid gap-2">
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  id="amountToStake"
                  value={amountToStake}
                  onChange={(e) => {
                    const value = Math.min(
                      Number(e.target.value),
                      amountStakable
                    );
                    setAmountToStake(value);
                  }}
                  disabled={disabled || amountStakable === 0}
                  type="number"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  onClick={() => setAmountToStake(amountStakable)}
                >
                  Max
                </Button>
              </div>
            </div>
            {(data?.[3] ?? 0) < amountToStake * 10 ** (data?.[0] ?? 18) ? (
            <Button
              className="w-full mt-4"
              onClick={() =>
                writeContract({
                  abi: erc20Abi,
                  address: token,
                  functionName: "approve",
                  args: [
                    CONTRACT_ADDRESS,
                    BigInt(amountToStake * 10 ** (data?.[0] ?? 18)),
                  ],
                })
              }
              disabled={disabled || amountStakable === 0 || isPending}
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <p>Approve</p>
              )}
            </Button>
          ) : (
            <Button
              className="w-full mt-4"
              onClick={() =>
                writeContract({
                  abi: CONTRACT_ABI,
                  address: CONTRACT_ADDRESS,
                  functionName: "stake",
                  args: [token, amountToStake * 10 ** (data?.[0] ?? 18)],
                })
              }
              disabled={disabled || amountStakable === 0 || isPending}
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <p>Stake</p>
              )}
            </Button>
          )}
          </TabsContent>

          <TabsContent value="unstake">
            <div className="grid gap-2">
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  id="amountToUnstake"
                  value={amountToUnstake}
                  onChange={(e) => {
                    const value = Math.min(
                      Number(e.target.value),
                      amountStaked
                    );
                    setAmountToUnstake(value);
                  }}
                  disabled={disabled || amountStaked === 0}
                  type="number"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  onClick={() => setAmountToUnstake(amountStaked)}
                >
                  Max
                </Button>
              </div>
            </div>
            <Button
              className="w-full mt-4"
              onClick={() =>
                writeContract({
                  abi: CONTRACT_ABI,
                  address: CONTRACT_ADDRESS,
                  functionName: "withdraw",
                  args: [token, amountToUnstake * 10 ** (data?.[0] ?? 18)],
                })
              }
              disabled={disabled || amountStaked === 0 || isPending}
            >
              {isPending ? <Loader2 className="animate-spin" /> : <p>Unstake</p>}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const Home: NextPage = () => {
  const account = useAccount();

  return (
    <div className="bg-background w-full h-screen flex items-center justify-center">
      {/* Top right corner: Wallet informations */}
      <div className="absolute top-0 right-0 p-4">
        <ConnectButton />
      </div>

      {/* Main content */}
      <StakingCard
        account={account}
        disabled={account.status !== "connected"}
      />

      {/* Bottom left corner: Debug informations */}
      <div className="absolute text-xs text-gray-500 bottom-0 left-0 p-4">
        status: {account.status}
        <br />
        address: {JSON.stringify(account.address)}
        <br />
        chainId: {account.chainId}
      </div>
    </div>
  );
};

export default Home;