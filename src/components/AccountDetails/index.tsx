import React, { useCallback, useContext } from 'react'
import { ExternalLink as LinkIcon } from 'react-feather'
import { useDispatch } from 'react-redux'
import styled, { ThemeContext } from 'styled-components'
import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import MetamaskIcon from '../../assets/images/metamask.png'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import Close from '../../assets/images/x.svg'
import connectors, { connectorLocalStorageKey } from '../../components/WalletModal/connectors'
import { useActiveWeb3React } from '../../hooks'
import { AppDispatch } from '../../state'
import { clearAllTransactions } from '../../state/transactions/actions'
import { ExternalLink, LinkStyledButton, TYPE } from '../../theme'
import { getExplorerLink, shortenAddress } from '../../utils'
import { ButtonSecondary } from '../ButtonLegacy'
import Identicon from '../Identicon'
import { AutoRow } from '../Row'
import Copy from './Copy'
import Transaction from './Transaction'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnect } from '@web3-react/walletconnect-v2'
import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { MetaMask } from '@web3-react/metamask'
import Image from 'next/image'

const HeaderRow = styled.div`
    ${({ theme }) => theme.flexRowNoWrap};
    padding: 1rem 1rem;
    font-weight: 500;
    font-size: 21px;
    color: ${props => (props.color === 'blue' ? ({ theme }) => theme.primary1 : 'inherit')};
    ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

const UpperSection = styled.div`
    position: relative;

    h5 {
        margin: 0;
        margin-bottom: 0.5rem;
        font-size: 1rem;
        font-weight: 500;
    }

    h5:last-child {
        margin-bottom: 0px;
    }

    h4 {
        margin-top: 0;
        font-weight: 500;
    }
`

const InfoCard = styled.div`
    // padding: 1rem;
    // border: 1px solid ${({ theme }) => theme.bg3};
    // border-radius: 10px;
    position: relative;
    display: grid;
    grid-row-gap: 12px;
    margin-bottom: 20px;
`

const AccountGroupingRow = styled.div`
    ${({ theme }) => theme.flexRowNoWrap};
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
    color: ${({ theme }) => theme.text1};

    div {
        ${({ theme }) => theme.flexRowNoWrap}
        align-items: center;
    }
`

const AccountSection = styled.div`
    // background-color: ${({ theme }) => theme.bg1};
    padding: 0rem 1rem;
    ${({ theme }) => theme.mediaWidth.upToMedium`padding: 0rem 1rem 1.5rem 1rem;`};
`

const YourAccount = styled.div`
    h5 {
        margin: 0 0 1rem 0;
        font-weight: 500;
    }

    h4 {
        margin: 0;
        font-weight: 500;
    }
`

const LowerSection = styled.div`
    ${({ theme }) => theme.flexColumnNoWrap}
    padding: 1.5rem;
    flex-grow: 1;
    overflow: auto;
    // background-color: ${({ theme }) => theme.bg2};
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;

    h5 {
        margin: 0;
        font-weight: 500;
        color: ${({ theme }) => theme.text3};
    }
`

const AccountControl = styled.div`
    display: flex;
    justify-content: space-between;
    min-width: 0;
    width: 100%;

    font-weight: 500;
    font-size: 1.55rem;

    a:hover {
        //text-decoration: underline;
    }

    p {
        min-width: 0;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`

const AddressLink = styled(ExternalLink)<{ hasENS: boolean; isENS: boolean }>`
    font-size: 0.825rem;
    color: ${({ theme }) => theme.text3};
    margin-left: 1rem;
    font-size: 0.825rem;
    display: flex;
    :hover {
        color: ${({ theme }) => theme.text2};
    }
`

const WalletName = styled.div`
    width: initial;
    font-size: 1rem;
    font-weight: 500;
    color: ${({ theme }) => theme.text3};
`

const IconWrapper = styled.div<{ size?: number }>`
    ${({ theme }) => theme.flexColumnNoWrap};
    align-items: center;
    justify-content: center;
    margin-right: 8px;
    & > img,
    span {
        height: ${({ size }) => (size ? size + 'px' : '32px')};
        width: ${({ size }) => (size ? size + 'px' : '32px')};
    }
    ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: flex-end;
  `};
`

const TransactionListWrapper = styled.div`
    ${({ theme }) => theme.flexColumnNoWrap};
`

const WalletAction = styled(ButtonSecondary)`
    width: fit-content;
    font-weight: 500;
    margin-left: 8px;
    font-size: 0.825rem;
    padding: 4px 6px;
    fontfamily: 'Metric - Bold' !important;
    :hover {
        cursor: pointer;
        //text-decoration: underline;
    }
`

const MainWalletAction = styled(WalletAction)`
    color: ${({ theme }) => theme.primary1};
`

function renderTransactions(transactions: string[]) {
    return (
        <TransactionListWrapper>
            {transactions.map((hash, i) => {
                return <Transaction key={i} hash={hash} />
            })}
        </TransactionListWrapper>
    )
}

interface AccountDetailsProps {
    toggleWalletModal: () => void
    pendingTransactions: string[]
    confirmedTransactions: string[]
    ENSName?: string
    openOptions: () => void
}

export default function AccountDetails({
    toggleWalletModal,
    pendingTransactions,
    confirmedTransactions,
    ENSName,
    openOptions
}: AccountDetailsProps): any {
    const { chainId, account, connector } = useActiveWeb3React()
    const theme = useContext(ThemeContext)
    const dispatch = useDispatch<AppDispatch>()

    function formatConnectorName() {
        const { ethereum } = window
        const isMetaMask = !!(ethereum && ethereum.isMetaMask)
        const name = connectors.filter(k => k.connector === connector).map(k => k.name)[0]
        return <WalletName>Connected with {name}</WalletName>
    }

    function getStatusIcon() {
        if (connector instanceof InjectedConnector) {
            return (
                <IconWrapper size={16}>
                    <Identicon />
                </IconWrapper>
            )
        } else if (connector instanceof WalletConnect) {
            return (
                <IconWrapper size={16}>
                    <Image width={16} height={16} src={WalletConnectIcon} alt={'wallet connect logo'} />
                </IconWrapper>
            )
        } else if (connector instanceof CoinbaseWallet) {
            return (
                <IconWrapper size={16}>
                    <Image width={16} height={16} src={CoinbaseWalletIcon} alt={'coinbase wallet logo'} />
                </IconWrapper>
            )
        } else if (connector instanceof MetaMask) {
            return (
                <IconWrapper size={16}>
                    <Image width={16} height={16} alt='metamask' src={MetamaskIcon} />
                </IconWrapper>
            )
        }
        // else if (connector === fortmatic) {
        //     return (
        //         <IconWrapper size={16}>
        //             <img src={FortmaticIcon} alt={'fortmatic logo'} />
        //         </IconWrapper>
        //     )
        // } else if (connector === portis) {
        //     return (
        //         <>
        //             <IconWrapper size={16}>
        //                 <img src={PortisIcon} alt={'portis logo'} />
        //                 <MainWalletAction
        //                     onClick={() => {
        //                         portis.portis.showPortis()
        //                     }}
        //                 >
        //                     Show Portis
        //                 </MainWalletAction>
        //             </IconWrapper>
        //         </>
        //     )
        // }
        // else if (connector === torus) {
        //     return (
        //         <IconWrapper size={16}>
        //             <img src={TorusIcon} alt={'torus logo'} />
        //         </IconWrapper>
        //     )
        // }
        return null
    }

    const clearAllTransactionsCallback = useCallback(() => {
        if (chainId) dispatch(clearAllTransactions({ chainId }))
    }, [dispatch, chainId])

    return (
        <>
            <UpperSection>
                <button className={'block ml-auto border-0 outline-none'} onClick={toggleWalletModal}>
                    <Image width={24} height={24} style={{ filter: 'invert(100%)' }} src={Close} alt={'close'} />
                </button>
                <HeaderRow>Account</HeaderRow>
                <AccountSection>
                    <YourAccount>
                        <InfoCard>
                            <AccountGroupingRow>
                                {formatConnectorName()}
                                <div>
                                    <WalletAction
                                        style={{ fontSize: '.825rem', fontWeight: 500, marginRight: '8px' }}
                                        onClick={() => {
                                            if (connector?.deactivate) {
                                                void connector.deactivate()
                                            } else {
                                                void connector.resetState()
                                            }
                                            window.localStorage.setItem(connectorLocalStorageKey, '')
                                        }}
                                    >
                                        Disconnect
                                    </WalletAction>
                                    {/* <WalletAction
                                        style={{
                                            fontSize: '.825rem',
                                            fontWeight: 500,
                                            color: '#ffa409',
                                            border: '1px solid #ffa409'
                                        }}
                                        onClick={() => {
                                            openOptions()
                                        }}
                                    >
                                        <b>Change</b>
                                    </WalletAction> */}
                                </div>
                            </AccountGroupingRow>
                            <AccountGroupingRow id="web3-account-identifier-row">
                                <AccountControl>
                                    {ENSName ? (
                                        <>
                                            <div>
                                                {getStatusIcon()}
                                                <p>
                                                    <b> {ENSName} </b>
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                {getStatusIcon()}
                                                <p>
                                                    <b> {account && shortenAddress(account)} </b>
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </AccountControl>
                            </AccountGroupingRow>
                            <AccountGroupingRow>
                                {ENSName ? (
                                    <>
                                        <AccountControl>
                                            <div className="-m-4">
                                                {account && (
                                                    <Copy toCopy={account}>
                                                        <span style={{ marginLeft: '4px' }}>Copy Address</span>
                                                    </Copy>
                                                )}
                                                {chainId && account && (
                                                    <AddressLink
                                                        hasENS={!!ENSName}
                                                        isENS={true}
                                                        href={
                                                            chainId ? getExplorerLink(chainId, ENSName, 'address') : '#'
                                                        }
                                                    >
                                                        <LinkIcon size={16} />
                                                        <span style={{ marginLeft: '4px' }}>View on explorer</span>
                                                    </AddressLink>
                                                )}
                                            </div>
                                        </AccountControl>
                                    </>
                                ) : (
                                    <>
                                        <AccountControl>
                                            <div>
                                                {account && (
                                                    <Copy toCopy={account}>
                                                        <span style={{ marginLeft: '4px' }}>Copy Address</span>
                                                    </Copy>
                                                )}
                                                {chainId && account && (
                                                    <AddressLink
                                                        hasENS={!!ENSName}
                                                        isENS={false}
                                                        href={getExplorerLink(chainId, account, 'address')}
                                                    >
                                                        <LinkIcon size={16} />
                                                        <span style={{ marginLeft: '4px', textDecoration: 'none' }}>
                                                            View on explorer
                                                        </span>
                                                    </AddressLink>
                                                )}
                                            </div>
                                        </AccountControl>
                                    </>
                                )}
                            </AccountGroupingRow>
                        </InfoCard>
                    </YourAccount>
                </AccountSection>
            </UpperSection>
            {!!pendingTransactions.length || !!confirmedTransactions.length ? (
                <LowerSection>
                    <AutoRow mb={'1rem'} style={{ justifyContent: 'space-between' }}>
                        <TYPE.body fontWeight={500}>Recent Transactions</TYPE.body>
                        <LinkStyledButton onClick={clearAllTransactionsCallback}>(clear all)</LinkStyledButton>
                    </AutoRow>
                    {renderTransactions(pendingTransactions)}
                    {renderTransactions(confirmedTransactions)}
                </LowerSection>
            ) : (
                <LowerSection>
                    <TYPE.body color={theme.text1}>Your transactions will appear here...</TYPE.body>
                </LowerSection>
            )}
        </>
    )
}
