import { AbstractConnector } from '@web3-react/abstract-connector'
import { darken } from 'polished'
import React from 'react'
import styled from 'styled-components'
import { injected } from '../../connectors'
import { SUPPORTED_WALLETS } from '../../constants'
import Loader from '../Loader'
import Option from './Option'
import { Connector } from '@web3-react/types'
import connectors from './connectors'

const PendingSection = styled.div`
    ${({ theme }) => theme.flexColumnNoWrap};
    align-items: center;
    justify-content: center;
    width: 100%;
    & > * {
        width: 100%;
    }
`

const StyledLoader = styled(Loader)`
    margin-right: 1rem;
`

const LoadingMessage = styled.div<{ error?: boolean }>`
    ${({ theme }) => theme.flexRowNoWrap};
    align-items: center;
    justify-content: flex-start;
    border-radius: ${({ theme }) => theme.borderRadius};
    margin-bottom: 20px;
    color: ${({ theme, error }) => (error ? theme.red1 : 'inherit')};
    border: 1px solid ${({ theme, error }) => (error ? theme.red1 : theme.text4)};

    & > * {
        padding: 1rem;
    }
`

const ErrorGroup = styled.div`
    ${({ theme }) => theme.flexRowNoWrap};
    align-items: center;
    justify-content: flex-start;
`

const ErrorButton = styled.div`
    border-radius: 8px;
    font-size: 12px;
    color: ${({ theme }) => theme.text1};
    background-color: ${({ theme }) => theme.bg4};
    margin-left: 1rem;
    padding: 0.5rem;
    font-weight: 600;
    user-select: none;

    &:hover {
        cursor: pointer;
        background-color: ${({ theme }) => darken(0.1, theme.text4)};
    }
`

const LoadingWrapper = styled.div`
    ${({ theme }) => theme.flexRowNoWrap};
    align-items: center;
    justify-content: center;
`

export default function PendingView({
    provider,
    error = false,
    setPendingError,
    tryActivation
}: {
    provider: any
    error?: boolean
    setPendingError: (error: boolean) => void
    tryActivation: (connector: Connector) => void
}) {
    const isMetamask = window?.ethereum?.isMetaMask
    return (
        <PendingSection>
            <LoadingMessage error={error}>
                <LoadingWrapper>
                    {error ? (
                        <ErrorGroup>
                            <div>Error connecting.</div>
                            <ErrorButton
                                onClick={() => {
                                    setPendingError(false)
                                    provider && tryActivation(provider)
                                }}
                            >
                                Try Again
                            </ErrorButton>
                        </ErrorGroup>
                    ) : (
                        <>
                            <StyledLoader />
                            Initializing...
                        </>
                    )}
                </LoadingWrapper>
            </LoadingMessage>
            {Object.keys(connectors).map(key => {
                const option = connectors[key]
                if (option.connector === provider.connector) {
                    if (option.connector === injected) {
                        if (isMetamask && option.name !== 'MetaMask') {
                            return null
                        }
                        if (!isMetamask && option.name === 'MetaMask') {
                            return null
                        }
                    }
                    return (
                        <Option
                            id={`connect-${key}`}
                            key={key}
                            clickable={false}
                            color={option.color}
                            header={option.name}
                            subheader={option.description}
                            icon={require('../../assets/images/' + option.iconName)}
                        />
                    )
                }
                return null
            })}
        </PendingSection>
    )
}