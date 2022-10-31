import { useWeb3Contract } from 'react-moralis'
import { contractAddresses, abi } from '../constants'
import { useMoralis } from 'react-moralis'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { useNotification } from '@web3uikit/core'

export default function LotteryEntrance() {
  const { chainId: chainIdHex, isWeb3Enabled, Moralis } = useMoralis()
  const chainId = parseInt(chainIdHex)
  //console.log(`Chain ID: ${chainId}`)
  const raffleAddress =
    chainId in contractAddresses ? contractAddresses[chainId][0] : null
  //console.log(`Contract address ${raffleAddress}`)
  const [entranceFee, setEntranceFee] = useState('0')
  const [numberOfPlayers, setNumberOfPlayers] = useState('0')
  const [recentWinner, setRecentWinner] = useState('0')

  const dispatch = useNotification()

  const { runContractFunction: getEntranceFee } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: 'getEntranceFee',
    params: {},
  })

  const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: 'getNumberOfPlayers',
    params: {},
  })

  const { runContractFunction: getRecentWinner } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: 'getRecentWinner',
    params: {},
  })

  async function updateUI() {
    const entranceFeeFromContract = (await getEntranceFee()).toString()
    setEntranceFee(entranceFeeFromContract)

    const numPlayers = (await getNumberOfPlayers()).toString()
    setNumberOfPlayers(numPlayers)

    const recentWinnerFromCall = (await getRecentWinner()).toString()
    setRecentWinner(recentWinnerFromCall)
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      updateUI()
    }
  }, [isWeb3Enabled])

  const {
    runContractFunction: enterRaffle,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: 'enterRaffle',
    params: {},
    msgValue: entranceFee,
  })

  const handleSuccess = async function (tx) {
    await tx.wait(1)
    handleNewNotification(tx)
    updateUI()
  }

  const handleNewNotification = function () {
    dispatch({
      type: 'info',
      message: 'Transaction Complete!',
      title: 'Tx Notification',
      position: 'topR',
    })
  }

  async function callEnterRaffle() {
    await enterRaffle({
      onSuccess: handleSuccess,
      onError: (error) => console.error(error),
    })
  }

  return (
    <div className="p-5">
      <h1 className="py-4 px-4 font-bold text-3xl">Lottery</h1>
      {raffleAddress ? (
        <div>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
            onClick={callEnterRaffle}
            disabled={isLoading || isFetching}
          >
            {isLoading || isFetching ? (
              <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
            ) : (
              'Enter Raffle'
            )}
          </button>
          <br />
          Entrance fee: {ethers.utils.formatUnits(entranceFee, 'ether')}
          <br />
          Number of Players: {numberOfPlayers}
          <br />
          Recent Winner: {recentWinner}
        </div>
      ) : (
        <div>No Raffle contract found</div>
      )}
    </div>
  )
}
