import React from 'react'
import { CardProps, Text } from 'rebass'
import { Box } from 'rebass/styled-components'
import styled from 'styled-components'

const Card = styled(Box)<{ width?: string; padding?: string; border?: string; borderRadius?: string }>`
    width: ${({ width }) => width ?? '100%'};
    border-radius: 10px;
    padding: 1.25rem;
    padding: ${({ padding }) => padding};
    border: ${({ border }) => border};
    border-radius: ${({ borderRadius }) => borderRadius};
`
export default Card

export const LightCard = styled(Card)`
    border: 1px solid ${({ theme }) => theme.bg2};
    background-color: #222540;
`

export const LightGreyCard = styled(Card)`
    background-color: ${({ theme }) => theme.bg2};
`

export const LightCardCustom = styled(Card)`
    background-color: #161825
`

export const GreyCard = styled(Card)`
    background-color: #22254077;
`

export const OutlineCard = styled(Card)`
    border: 1px solid ${({ theme }) => theme.bg3};
`

export const YellowCard = styled(Card)`
    background-color: rgba(243, 132, 30, 0.05);
    color: ${({ theme }) => theme.yellow2};
    font-weight: 500;
`

export const PinkCard = styled(Card)`
    background-color: rgba(255, 0, 122, 0.03);
    color: ${({ theme }) => theme.primary1};
    font-weight: 500;
`

const BlueCardStyled = styled(Card)`
    background-color: transparent;
    color: white;
    border-radius: ${({ theme }) => theme.borderRadius};
    width: fit-content;
`

export const BlueCard = ({ children, ...rest }: CardProps) => {
    return (
        <BlueCardStyled {...rest}>
            <Text fontWeight={500} color="#0094ec">
                {children}
            </Text>
        </BlueCardStyled>
    )
}
