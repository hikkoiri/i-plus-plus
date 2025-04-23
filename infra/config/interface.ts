import { StackProps } from "aws-cdk-lib";

export interface IPlusPlusStackProps extends StackProps {
    domainName: string,
    subdomainName: string,
    corsAllowedOrigin: string,
    existingWildCardDomainCertArn?: string
}